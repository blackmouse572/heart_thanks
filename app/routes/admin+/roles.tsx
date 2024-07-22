import Checkbox from '#app/components/checkbox.js'
import DataTable, {
	DataTableRef,
} from '#app/components/data-table/data-table.js'
import { prisma } from '#app/utils/db.server.js'
import { requireUserWithPermission } from '#app/utils/permissions.server.js'
import { getMetadata } from '#app/utils/request.server.js'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import React, { useCallback, useMemo, useState } from 'react'
import FilterItem from './filter'
import users from './users'
import SlidePanel from '#app/components/drawer.js'
import { Icon } from '#app/components/ui/icon.js'
import { z } from 'zod'
import { CreateNewRoleSchema, CreateRolePanel } from './CreateRolePanel'

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

import { type ActionFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: (intent) =>
			CreateNewRoleSchema.transform(async (data, ctx) => {
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

	return json({ result: { ok: true }, data: value })
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
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
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
	const ref = React.useRef<DataTableRef>(null)
	const [selectedRoles, setSelectedRoles] = useState<RoleLoaderData[]>([])
	const [updateOpen, setUpdateOpen] = useState(false)
	// const [deleteOpen, setDeleteOpen] = useState(false)
	const firstSelected = useMemo(() => selectedRoles[0], [selectedRoles])

	const handleSetSelect = useCallback(
		(obj: RowSelectionState) => {
			const ids = Object.keys(obj)
			console.log({ ids, obj })
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
			{/* {firstSelected && (
				<DetailPanel
					role={firstSelected}
					onEdited={() => {}}
					open={updateOpen}
					setOpen={setUpdateOpen}
				/>
			)} */}
		</div>
	)
}
