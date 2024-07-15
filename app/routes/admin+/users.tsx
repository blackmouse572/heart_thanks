import Checkbox from '#app/components/checkbox.js'
import DataTable, {
	DataTableRef,
} from '#app/components/data-table/data-table.js'
import Badge from '#app/components/ui/badge.js'
import { Caption } from '#app/components/ui/typography/index.js'
import { Link } from '#app/components/ui/typography/link.js'
import UserAvatar from '#app/components/user-avatar.js'
import { prisma } from '#app/utils/db.server.js'
import {
	requireUserWithPermission,
	requireUserWithRole,
} from '#app/utils/permissions.server.js'
import { getMetadata, parseSort } from '#app/utils/request.server.js'
import { Prisma } from '@prisma/client'
import {
	type LoaderFunctionArgs,
	ActionFunctionArgs,
	json,
} from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import {
	ColumnDef,
	RowSelectionRow,
	RowSelectionState,
} from '@tanstack/react-table'
import { createNewUser, getAllUsers, updateUser } from './user.server'
import FilterItem from './filter'
import Aligner from '#app/components/ui/aligner.js'
import CreateUserPanel from './CreateUserPanel'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const metadata = getMetadata(request)
	const { search, sort } = metadata
	const sortObj = parseSort(sort)
	const where: Prisma.UserWhereInput = {
		AND: [
			{
				OR: [
					{
						username: {
							contains: search,
						},
					},
					{
						email: {
							contains: search,
						},
					},
					{
						name: {
							contains: search,
						},
					},
				],
			},
		],
	}
	const currentSetting = await prisma.applicationSetting.findFirst({
		where: {
			isUsed: true,
		},
	})
	const users = await getAllUsers(where, metadata, sortObj).then((u) => u)
	const totals = await prisma.user.count({ where })
	metadata.totals = totals
	metadata.setting = currentSetting
	return json({ metadata, users })
}

import { checkHoneypot } from '#app/utils/honeypot.server.js'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Icon } from '#app/components/ui/icon.js'
import UpdateUserPanel from './EditUserPanel'
import DeleteUser from './DeleteUserModal'

export async function action({ request }: ActionFunctionArgs) {
	requireUserWithPermission(request, 'create:user:any')
	const formData = await request.formData()
	const formMethod = request.method
	checkHoneypot(formData)

	if (formMethod === 'POST') {
		return createNewUser(formData)
	} else if (formMethod === 'PUT') {
		// Update user
		return updateUser(formData)
	} else if (formMethod === 'DELETE') {
		// Delete user
		const ids = formData.get('ids') as string
		const idArray = ids.split(',')
		const result = await prisma.user.deleteMany({
			where: {
				id: {
					in: idArray,
				},
			},
		})
		return json({
			result: {
				ok: true,
				amount: result.count,
			},
			user: {},
		})
	}
	throw new Error('Method not allowed')
}

export type LoaderDataUser = Awaited<
	ReturnType<Awaited<ReturnType<typeof loader>>['json']>
>['users'][0]
export type LoaderRole = LoaderDataUser['roles'][0]

const columns: ColumnDef<LoaderDataUser>[] = [
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
		id: 'user',
		accessorFn: (row) => row,
		header: 'Username',
		enableSorting: false,
		enableHiding: false,
		cell: (cell) => {
			const id = cell.getValue() as LoaderDataUser
			return (
				<UserAvatar
					imageId={id.image?.id}
					title={id.name ?? id.username}
					description={id.username}
				/>
			)
		},
	},
	{
		accessorKey: 'balance',
		header: 'Balance',
		enableSorting: true,
		cell: (cell) => {
			const balance = cell.getValue() as number
			return <Caption className="relative">{balance}💖</Caption>
		},
	},
	{
		accessorKey: 'vault',
		header: 'Vault',
		enableSorting: true,
		cell: (cell) => {
			const vault = cell.getValue() as number
			return <Caption className="relative">{vault}💖</Caption>
		},
	},
	{
		accessorKey: 'roles',
		header: 'Roles',
		enableSorting: false,
		cell: (cell) => {
			const roles = cell.getValue() as LoaderRole[]
			const key = cell.row.original.id
			return (
				<div className="flex flex-wrap gap-2">
					{roles.map((role) => {
						return (
							<Badge
								className="uppercase"
								size="sm"
								key={key + role.name}
								intent={role.name === 'admin' ? 'accent' : 'primary'}
							>
								{role.name}
							</Badge>
						)
					})}
				</div>
			)
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Created at',
		enableSorting: true,
		cell: (cell) => {
			const balance = cell.getValue() as number
			return <Caption>{new Date(balance).toLocaleDateString()}</Caption>
		},
	},
]
function UserAdminPage() {
	const { metadata, users } = useLoaderData<typeof loader>()
	const [selectedUsers, setSelectedUsers] = useState<LoaderDataUser[]>([])
	const [updateOpen, setUpdateOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const firstSelected = useMemo(() => selectedUsers[0], [selectedUsers])
	const tableRef = useRef<DataTableRef>(null)
	const navigate = useNavigate()

	const handleSetSelect = useCallback(
		(obj: RowSelectionState) => {
			const ids = Object.keys(obj)
			let newSelectedUsers = users.filter((user) => ids.includes(user.id))
			setSelectedUsers(newSelectedUsers as any)
		},
		[users],
	)

	return (
		<div className="container mt-24 lg:mt-5">
			<DataTable
				title="Users"
				description="Manage users on the platform"
				data={users}
				metadata={metadata as any}
				columns={columns as any}
				onSelectionChange={handleSetSelect}
				withPagination
				filter={
					<Aligner>
						<CreateUserPanel settings={metadata.setting} />
						<FilterItem />
					</Aligner>
				}
				getRowId={(row) => row.id}
				actions={[
					[
						{
							label: 'View details',
							icon: <Icon name="eye" />,
							mode: 'single',
							onClick: (a) => {
								const ids = Object.keys(a)
								const user = users.find((u) => u.id === ids[0])
								navigate(`/users/${user?.username}`)
							},
						},
						{
							label: 'Edit user',
							icon: <Icon name="pencil-1" />,
							mode: 'single',
							onClick: (a) => {
								handleSetSelect(a)
								setUpdateOpen(true)
							},
						},
					],
					[
						{
							label: 'Delete users',
							icon: <Icon name="trash" />,
							intent: 'danger',
							onClick: (a) => {
								handleSetSelect(a)
								setDeleteOpen(true)
							},
						},
					],
				]}
			/>
			{firstSelected && (
				<UpdateUserPanel
					onEdited={() => {
						tableRef.current?.deselectAll()
					}}
					open={updateOpen}
					setOpen={setUpdateOpen}
					user={firstSelected}
					settings={metadata.setting}
				/>
			)}
			{firstSelected && (
				<DeleteUser
					open={deleteOpen}
					setOpen={setDeleteOpen}
					users={selectedUsers}
				/>
			)}
		</div>
	)
}

export default UserAdminPage
