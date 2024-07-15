import { prisma } from '#app/utils/db.server.js'
import { Metadata } from '#app/utils/request.server.js'
import { Prisma } from '@prisma/client'
import { CreateNewUserSchema } from './CreateUserPanel'
import { parseWithZod } from '@conform-to/zod'
import { json } from '@remix-run/node'
import { createPassword } from '#tests/db-utils.js'
import { z } from 'zod'
import { UpdateUserSchema } from './EditUserPanel'

export function getAllUsers(
	where: Prisma.UserWhereInput,
	metadata: Metadata,
	orderBy: Record<string, any>,
) {
	return prisma.user.findMany({
		where,
		orderBy,
		skip: Number(metadata.skip),
		take: Number(metadata.take),
		select: {
			id: true,
			username: true,
			email: true,
			name: true,
			balance: true,
			vault: true,
			createdAt: true,
			roles: {
				select: {
					name: true,
					id: true,
				},
			},
			image: {
				select: {
					id: true,
				},
			},
		},
	})
}

export async function createNewUser(formData: FormData) {
	const submission = await parseWithZod(formData, {
		schema: (intent) =>
			CreateNewUserSchema.transform(async (data, ctx) => {
				if (intent !== null) return data

				// username should be unique
				const user = await prisma.user.findUnique({
					where: {
						username: data.username,
					},
				})
				if (user) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['username'],
						message: 'Username already exists',
					})
					return z.NEVER
				}

				// email should be unique
				const email = await prisma.user.findUnique({
					where: {
						email: data.email,
					},
				})

				if (email) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['email'],
						message: 'Email already exists',
					})
					return z.NEVER
				}

				// roles should be valid
				const roles = await prisma.role.findMany({
					where: {
						id: {
							in: data.roles,
						},
					},
				})

				if (roles.length !== data.roles.length) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['roles'],
						message: 'Invalid role',
					})
					return z.NEVER
				}

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
	const user = await prisma.user.create({
		data: {
			email: value.email,
			username: value.username,
			balance: value.balance,
			name: value.name,
			password: {
				create: createPassword(value.password),
			},
			vault: value.vaul,
			roles: {
				connect: value.roles.map((role: string) => ({
					id: role,
				})),
			},
		},
	})

	return json({ result: { ok: true }, user })
}

export async function updateUser(formData: FormData) {
	const submission = await parseWithZod(formData, {
		schema: (intent) =>
			UpdateUserSchema.transform(async (data, ctx) => {
				if (intent !== null) return data

				// username should be unique
				const user = await prisma.user.findUnique({
					where: {
						username: data.username,
						NOT: {
							id: data.id,
						},
					},
				})
				if (user) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['username'],
						message: 'Username already exists',
					})
					return z.NEVER
				}

				// email should be unique
				const email = await prisma.user.findUnique({
					where: {
						email: data.email,
						NOT: {
							id: data.id,
						},
					},
				})

				if (email) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['email'],
						message: 'Email already exists',
					})
					return z.NEVER
				}

				// roles should be valid
				const roles = await prisma.role.findMany({
					where: {
						id: {
							in: data.roles,
						},
					},
				})

				if (roles.length !== data.roles?.length) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['roles'],
						message: 'Invalid role',
					})
					return z.NEVER
				}
				if (data.password === '') {
					data.password = undefined
				}

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
	const user = await prisma.user.update({
		where: {
			id: value.id,
		},
		data: {
			email: value.email,
			username: value.username,
			balance: value.balance,
			name: value.name,
			password: value.password
				? {
						create: createPassword(value.password),
					}
				: undefined,
			vault: value.vaul,
			roles: value.roles
				? {
						set: value.roles.map((role: string) => ({
							id: role,
						})),
					}
				: undefined,
		},
		include: {
			roles: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	})

	return json({ result: {}, user })
}
