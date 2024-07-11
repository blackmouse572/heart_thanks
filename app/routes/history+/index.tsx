import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { type ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import Checkbox from '#app/components/checkbox'
import DataTable from '#app/components/data-table/data-table.js'
import { Caption } from '#app/components/ui/typography/caption.js'
import { Icon } from '#app/components/ui/icon.js'
import { Text } from '#app/components/ui/typography/text.js'
import UserAvatar from '#app/components/user-avatar.js'
import {
	getMaxTransactionAmount,
	getMinTransactionAmount,
	getUserTransaction,
	getUserTransactionCount,
} from '#app/routes/history+/history.server.ts'
import { requireUserId } from '#app/utils/auth.server.js'
import { getMetadata, parseSort } from '#app/utils/request.server.js'
import FilterItem from './filter'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const metadata = getMetadata(request)
	const { search, min, max, sort } = metadata
	const sortObj = parseSort(sort)
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
			min !== undefined && max !== undefined
				? {
						amount: {
							gte: parseInt(min) || 0,
							lte: parseInt(max) || 100000,
						},
					}
				: {},
		],
	}
	const user = await getUserTransaction(metadata, where, sortObj)
	const totals = await getUserTransactionCount(where, sortObj)
	const [minV, maxV] = await Promise.all([
		getMinTransactionAmount(userId),
		getMaxTransactionAmount(userId),
	])
	metadata.totals = totals
	metadata.min = minV?.amount
	metadata.max = maxV?.amount
	metadata.filter = {
		min,
		max,
	}

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
				indeterminate={table.getIsSomePageRowsSelected() || false}
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
		header: 'ID',
		cell: (cell) => {
			const id = cell.getValue() as string
			return (
				<Caption className="max-w-12 overflow-hidden truncate">{id}</Caption>
			)
		},
	},
	{
		accessorKey: 'owner',
		header: 'Owner',
		enableSorting: false,
		cell: (cell) => {
			const user = cell.getValue() as LoaderDataUser['owner']
			return (
				<UserAvatar
					imageId={user.image?.id}
					href={`/users/${user.username}`}
					title={user.name ?? user.username}
					description={user.username}
				/>
			)
		},
	},
	{
		accessorKey: 'receiver',
		enableSorting: false,
		header: 'Receiver',
		cell: (cell) => {
			const user = cell.getValue() as LoaderDataUser['owner']
			return (
				<UserAvatar
					imageId={user.image?.id}
					href={`/users/${user.username}`}
					title={user.name ?? user.username}
					description={user.username}
				/>
			)
		},
	},
	{
		accessorKey: 'amount',
		header: 'Amount',
		enableSorting: true,
		cell: (cell) => {
			return (
				<Text className="overflow-hidden truncate">
					{cell.getValue() as string} 💖
				</Text>
			)
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Transfer At',
		enableSorting: true,
		cell: (cell) => {
			const date = cell.getValue() as string
			const localeDate = new Date(date).toLocaleDateString()
			return <Caption className="">{localeDate}</Caption>
		},
	},
]
export { columnsDef as historyColumnDef }
export type { LoaderDataUser as HistoryData }
function HistoryPage() {
	const { user, metadata } = useLoaderData<typeof loader>()
	return (
		<div className="container mt-5">
			<DataTable
				metadata={metadata as any}
				withPagination
				title={`History Transaction`}
				description={`Showing ${metadata.take}/${metadata.totals} transactions`}
				columns={columnsDef}
				className="max-h-[500px] w-full overflow-y-auto"
				data={user as unknown as any}
				actions={[
					[
						{
							label: 'Copy ID',
							icon: <Icon name="envelope-closed" />,
							mode: 'single',
							onClick: (item) => {
								// get item
								const id = Object.keys(item)[0] as string
								// copy to clipboard
								navigator.clipboard.writeText(id)
								toast.success('ID copied to clipboard')
							},
						},
						{
							label: 'Delete',
							icon: <Icon name="trash" />,
							mode: 'multiple',
							intent: 'danger',
						},
					],
				]}
				getRowId={(row) => row.id}
				filter={<FilterItem metadata={metadata as any} />}
			/>
			<hr />
		</div>
	)
}

export default HistoryPage
