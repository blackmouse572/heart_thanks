import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { type ColumnDef } from '@tanstack/react-table'
import { Caption } from '#app/components/ui/caption.js'
import { Title } from '#app/components/ui/title.js'
import UserAvatar from '#app/components/user-avatar.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import { getMetadata } from '#app/utils/request.server.js'
import DataTable from './data-table'
import { Text } from '#app/components/ui/text'
import Checkbox from '#app/components/checkbox'
import { Icon } from '#app/components/ui/icon'
import Button from '#app/components/ui/button.js'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const metadata = getMetadata(request)
	const { search, skip, take } = metadata
	const where = {
		AND: [
			{
				OR: [
					{
						ownerId: userId,
					},
					{
						receiverId: userId,
					},
				],
			},
			{
				OR: [
					{
						title: {
							contains: search,
						},
					},
					{
						content: {
							contains: search,
						},
					},
				],
			},
		],
	}
	const user = await prisma.transactions.findMany({
		where,
		select: {
			id: true,
			title: true,
			content: true,
			createdAt: true,
			owner: {
				select: {
					username: true,
					name: true,
					image: {
						select: {
							id: true,
						},
					},
				},
			},
			receiver: {
				select: {
					username: true,
					name: true,
					image: {
						select: {
							id: true,
						},
					},
				},
			},
		},
		skip,
		take,
	})
	const totals = await prisma.transactions.aggregate({
		where,
		_count: true,
	})

	metadata.totals = totals._count

	return json({
		user,
		metadata,
	})
}
type LoaderDataUser = Awaited<
	ReturnType<Awaited<ReturnType<typeof loader>>['json']>
>['user'][0]
const columnsDef: ColumnDef<LoaderDataUser>[] = [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && 'indeterminate')
				}
				indeterminate={table.getIsSomePageRowsSelected()}
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
		header: 'ID',
		cell: (cell) => {
			const id = cell.getValue() as string
			return (
				<Caption className="max-w-12 overflow-hidden truncate">{id}</Caption>
			)
		},
	},
	{
		accessorKey: 'title',
		header: 'Title',
		cell: (cell) => {
			return (
				<Text className="overflow-hidden truncate">
					{cell.getValue() as string}
				</Text>
			)
		},
	},
	{
		accessorKey: 'owner',
		header: 'Owner',
		cell: (cell) => {
			const user = cell.getValue() as LoaderDataUser['owner']
			return (
				<UserAvatar
					imageId={user.image?.id}
					title={user.name ?? user.username}
					description={user.username}
				/>
			)
		},
	},
	{
		accessorKey: 'receiver',
		header: 'Receiver',
	},
	{
		accessorKey: 'amount',
		header: 'Amount',
	},
]
function HistoryPage() {
	const { user, metadata } = useLoaderData<typeof loader>()
	return (
		<div className="container mt-5">
			<DataTable
				title={`History Transaction`}
				description={`Showing ${metadata.totals} transactions`}
				columns={columnsDef}
				data={user as unknown as any}
			/>
			<hr />
			{JSON.stringify(metadata)}
		</div>
	)
}

export default HistoryPage
