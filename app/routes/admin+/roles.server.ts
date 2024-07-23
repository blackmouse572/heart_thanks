import { prisma } from '#app/utils/db.server.js'
import { Role } from '@prisma/client'
import { json } from '@remix-run/node'
import { z } from 'zod'
import { CreateNewRoleSchema } from './CreateRolePanel'
import { parseWithZod } from '@conform-to/zod'

export async function updateOrCreateRole(request: Request) {
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: (intent) =>
			CreateNewRoleSchema.transform(async (data, ctx) => {
				if (data.name === 'admin' || data.name === 'user') {
					ctx.addIssue({
						message: 'Role name cannot be admin or user',
						code: z.ZodIssueCode.custom,
						path: ['name'],
					})

					return
				}
				const [userRole, adminRole] = await Promise.all([
					prisma.role.findFirst({
						where: {
							name: 'user',
						},
					}),
					prisma.role.findFirst({
						where: {
							name: 'admin',
						},
					}),
				])

				if (data.id === userRole?.id || data.id === adminRole?.id) {
					ctx.addIssue({
						message: 'Role cannot be updated',
						code: z.ZodIssueCode.custom,
						path: ['name'],
					})
					return
				}

				const toPermission = data.permissions
				data.permissions = toPermission
					?.filter((a) => a.enabled === 'on')
					.map((e) => ({ ...e, enabled: undefined }))

				return data
			}),
		async: true,
	})
	if (submission.status !== 'success' || !submission.value) {
		return json(
			{ result: submission.reply(), user: {} },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}
	const { value } = submission
	const { name, permissions, description } = value
	const queryPermissions = permissions.map((per) => {
		const { entity, action, access } = per
		return prisma.permission.findFirst({
			where: {
				AND: [
					{
						entity,
						access,
						action,
					},
				],
			},
		})
	})

	const permissionsData = await Promise.all(queryPermissions)

	if (permissionsData.length !== permissions.length) {
		return json({
			result: { ok: false },
			message: 'Some permissions does not exist',
		})
	}

	let role: Role
	// create new roles
	if (value.id) {
		role = await prisma.role.update({
			where: {
				id: value.id,
			},
			data: {
				name,
				description: description ?? '',
				permissions: {
					connect: permissionsData.map((per) => ({ id: per!.id })),
				},
			},
		})
	} else {
		role = await prisma.role.create({
			data: {
				name,
				description,
				permissions: {
					connect: permissionsData.map((per) => ({ id: per!.id })),
				},
			},
		})
	}

	return json({ result: { ok: true }, data: role })
}

export async function deleteRoles(request: Request) {
	const formData = await request.formData()
	const ids = formData.getAll('id') as unknown as string[]
	if (!ids) {
		return json({ result: { ok: false }, message: 'No ids provided' })
	}
	const [userRole, adminRole] = await Promise.all([
		prisma.role.findFirst({
			where: {
				name: 'user',
			},
		}),
		prisma.role.findFirst({
			where: {
				name: 'admin',
			},
		}),
	])

	if (ids.includes(userRole!.id) || ids.includes(adminRole!.id)) {
		return json({
			result: {
				ok: false,
			},
			message: 'Cannot delete user or admin role',
		})
	}

	const result = await prisma.role.deleteMany({
		where: {
			id: {
				in: ids,
			},
		},
	})

	return json({
		result: {
			ok: true,
			amount: result.count,
		},
		role: {},
	})
}
