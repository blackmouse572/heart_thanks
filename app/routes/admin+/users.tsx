import Checkbox from '#app/components/checkbox.js'
import DataTable from '#app/components/data-table/data-table.js'
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
import { useLoaderData } from '@remix-run/react'
import { ColumnDef } from '@tanstack/react-table'
import { getAllUsers } from './user.server'
import FilterItem from './filter'
import Aligner from '#app/components/ui/aligner.js'
import CreateUserPanel, { CreateNewUserSchema } from './CreateUserPanel'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const metadata = getMetadata(request)
	const { search, min, max, sort, skip, take } = metadata
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
import { parseWithZod } from '@conform-to/zod'
import { z } from 'zod'
import { createPassword } from '#tests/db-utils.js'

export async function action({ request }: ActionFunctionArgs) {
	requireUserWithPermission(request, 'create:user:any')
	const formData = await request.formData()
	checkHoneypot(formData)
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
		console.error(submission)
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
				connect: value.roles.map((role) => ({
					id: role,
				})),
			},
		},
	})
	return json({
		user,
		result: {},
	})
}

type LoaderDataUser = Awaited<
	ReturnType<Awaited<ReturnType<typeof loader>>['json']>
>['users'][0]
type LoaderRole = LoaderDataUser['roles'][0]

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
				<Link href={`/users/${id.username}`}>
					<UserAvatar
						imageId={id.image?.id}
						title={id.name ?? id.username}
						description={id.username}
					/>
				</Link>
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
	return (
		<div className="container mt-24 lg:mt-5">
			<DataTable
				title="Users"
				description
				data={users}
				metadata={metadata as any}
				columns={columns as any}
				withPagination
				filter={
					<Aligner>
						<CreateUserPanel settings={metadata.setting} />
						<FilterItem />
					</Aligner>
				}
			/>
		</div>
	)
}

export default UserAdminPage
