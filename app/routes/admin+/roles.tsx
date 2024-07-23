import Checkbox from '#app/components/checkbox.js'
import DataTable from '#app/components/data-table/data-table.js'
import { prisma } from '#app/utils/db.server.js'
import { requireUserWithPermission } from '#app/utils/permissions.server.js'
import { getMetadata } from '#app/utils/request.server.js'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
} from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import React, { useCallback, useMemo, useState } from 'react'
import FilterItem from './filter'
import users from './users'
import { Icon } from '#app/components/ui/icon.js'
import { CreateNewRoleSchema, CreateRolePanel } from './CreateRolePanel'

import { parseWithZod } from '@conform-to/zod'
import { Role } from '@prisma/client'
import { z } from 'zod'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithPermission(request, 'read:role:any,own')
	const metadata = getMetadata(request)
	const { search, skip, take } = metadata
	const where = {
		OR: search
			? [
					{
						name: {
							contains: search,
						},
					},
				]
			: undefined,
	}
	const roles = await prisma.role.findMany({
		where,
		include: {
			permissions: true,
		},
		skip,
		take,
	})
	const totals = await prisma.role.count({ where })
	metadata.totals = totals
	return json({
		roles,
		metadata,
	})
}
export async function action({ request }: ActionFunctionArgs) {
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

export type RoleLoaderData = Awaited<
	ReturnType<Awaited<ReturnType<typeof loader>>['json']>
>['roles'][0]

const columns: ColumnDef<RoleLoaderData>[] = [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && 'indeterminate')
				}
				indeterminate={table.getIsSomePageRowsSelected() ?? false}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row: { getIsSelected, toggleSelected, original } }) => {
			return (
				<Checkbox
					checked={getIsSelected()}
					onCheckedChange={(value) => toggleSelected(!!value)}
					aria-label="Select row"
				/>
			)
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'id',
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'name',
		header: 'Name',
		enableSorting: false,
	},
	{
		accessorKey: 'description',
		header: 'Description',
		enableSorting: false,
	},
	{
		accessorFn: (row) => row.permissions,
		header: 'Entities',
		enableSorting: false,
		cell: (cell) => {
			const value = cell.getValue() as RoleLoaderData['permissions']
			const entityDistinct = new Set(
				value.map((permission) => permission.entity),
			)
			return entityDistinct.size
		},
	},
	{
		accessorFn: (row) => row.permissions.map((permission) => permission.action),
		header: 'Actions',
		enableSorting: false,
		cell: (cell) => {
			const value = cell.getValue() as RoleLoaderData['permissions']
			const actionsDistinct = new Set(
				value.map((permission) => permission.action),
			)
			return actionsDistinct.size
		},
	},
	{
		accessorFn: (row) => row.permissions.map((permission) => permission.access),
		header: 'Access',
		enableSorting: false,
		cell: (cell) => {
			const value = cell.getValue() as RoleLoaderData['permissions']
			const accessDistinct = new Set(
				value.map((permission) => permission.access),
			)
			return accessDistinct.size
		},
	},
]

export default function AdminRoles() {
	const { roles, metadata } = useLoaderData<typeof loader>()
	const [selectedRoles, setSelectedRoles] = useState<RoleLoaderData[]>([])
	const [updateOpen, setUpdateOpen] = useState(false)
	const firstSelected = useMemo(() => selectedRoles[0], [selectedRoles])

	const handleSetSelect = useCallback(
		(obj: RowSelectionState) => {
			const ids = Object.keys(obj)
			let newSelectedUsers = roles.filter((user) => ids.includes(user.id))
			setSelectedRoles(newSelectedUsers as any)
		},
		[users],
	)
	return (
		<div className="container mt-24 lg:mt-5">
			<DataTable
				title="Roles"
				description="Manage roles and its permissions"
				columns={columns}
				withPagination
				getRowId={(row) => row.id}
				metadata={metadata as any}
				onSelectionChange={handleSetSelect}
				actions={[
					[
						{
							label: 'View details',
							icon: <Icon name="eye" />,
							onClick: (a) => {
								handleSetSelect(a)
								setUpdateOpen(true)
							},
							mode: 'single',
						},
					],
				]}
				data={roles as any}
				filter={
					<div className="flex gap-2">
						<CreateRolePanel />
						<FilterItem />
					</div>
				}
			/>
			{/* EDIT PERMISSION */}
			<CreateRolePanel
				defaultValue={firstSelected}
				open={updateOpen}
				setOpen={setUpdateOpen}
				type="update"
			/>
		</div>
	)
}
