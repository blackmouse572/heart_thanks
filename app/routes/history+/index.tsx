import Checkbox from '#app/components/checkbox'
import DataTable from '#app/components/data-table/data-table.js'
import Badge from '#app/components/ui/badge.js'
import Button from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { Caption } from '#app/components/ui/typography/caption.js'
import { Text } from '#app/components/ui/typography/text.js'
import { Title } from '#app/components/ui/typography/title.js'
import UserAvatar from '#app/components/user-avatar.js'
import {
	getMaxTransactionAmount,
	getMinTransactionAmount,
	getTotalsRequireReview,
	getUserTransaction,
	getUserTransactionCount,
} from '#app/routes/history+/transaction.server.ts'
import { requireUserId } from '#app/utils/auth.server.js'
import { getMetadata, parseSort } from '#app/utils/request.server.js'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { type ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import FilterItem from './filter'
import { Prisma } from '@prisma/client'
import { defaultPreferences } from '#app/utils/settings.server.js'
import RequireReviewCard from '#app/components/history/RequiredReviewCard.js'
import { getPreferences } from '../settings+/profile.preferences.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const metadata = getMetadata(request)
	const preferences = getPreferences(request)
	const { search, min, max, sort, needReview: _needReview, reviewer } = metadata
	const needReviewBool = _needReview === 'false'
	const needReview = _needReview === 'all' ? undefined : _needReview
	const sortObj = parseSort(sort)
	const where: Prisma.TransactionsWhereInput = {
		AND: [
			{
				OR: [
					{
						ownerId: userId,
					},
					{
						receiverId: userId,
					},
					{
						reviewedById: userId,
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
			needReview
				? {
						reviewed: !needReviewBool,
					}
				: {},
			reviewer
				? {
						reviewBy: {
							username: reviewer,
						},
					}
				: {},
		],
	}
	const user = await getUserTransaction(metadata, where, sortObj)
	const totals = await getUserTransactionCount(where, sortObj)
	const totalsRequireReview = preferences.history.showNeedReviewBanner
		? await getTotalsRequireReview(userId)
		: 0
	const [minV, maxV] = await Promise.all([
		getMinTransactionAmount(userId),
		getMaxTransactionAmount(userId),
	])
	metadata.totals = totals
	metadata.min = minV?.amount
	metadata.max = maxV?.amount
	metadata.totalsRequireReview = totalsRequireReview
	metadata.filter = {
		min,
		max,
	}
	metadata.reviewer = reviewer && user[0]?.reviewBy

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
				<Link to={`/history/${id}`}>
					<Caption className="max-w-12 overflow-hidden truncate">{id}</Caption>
				</Link>
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
		accessorKey: 'reviewBy',
		enableSorting: false,
		header: 'Review By',
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
		accessorKey: 'reviewedAt',
		header: 'Reviewed At',
		enableSorting: true,
		cell: (cell) => {
			const isReviewed = cell.row.original.reviewed
			const date = cell.getValue() as string
			const localeDate = new Date(date).toLocaleDateString()
			return isReviewed ? (
				<Caption className="overflow-hidden truncate">{localeDate}</Caption>
			) : (
				<Badge size="sm" variant="outlined" intent="gray">
					Not Reviewed
				</Badge>
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
		<div className="container mt-24 space-y-4 lg:mt-5">
			{metadata.totalsRequireReview > 0 && (
				<RequireReviewCard total={metadata.totalsRequireReview} />
			)}
			<DataTable
				metadata={metadata as any}
				withPagination
				title={`History Transaction`}
				description={`Showing ${metadata.take}/${metadata.totals} transactions`}
				emptyRender={<EmptyTable />}
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
				filter={
					<>
						<FilterItem metadata={metadata as any} />
					</>
				}
			/>
			<hr />
		</div>
	)
}

export function EmptyTable() {
	return (
		<div className="flex flex-col items-center justify-center space-y-8 py-4">
			<div className="space-y-2 text-center">
				<Icon
					name="error-404-off"
					size="xl"
					className="h-40 w-40 text-[--body-text-color]"
				/>
				<Title size="lg">You don't seem to have any transaction here</Title>
				<Text>
					Let transfer some love 💖 to thanks for all the help you got
				</Text>
			</div>
			<Button.Root variant="outlined" intent="secondary" href="/transfer">
				<Button.Label>Transfer Now</Button.Label>
				<Button.Icon type="trailing">
					<Icon name="transfer" />
				</Button.Icon>
			</Button.Root>
		</div>
	)
}

export default HistoryPage
