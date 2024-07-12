import { prisma } from '#app/utils/db.server.js'
import {
	requireUserWithPermission,
	requireUserWithRole,
} from '#app/utils/permissions.server.js'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { EmptyTable, historyColumnDef } from '../history+'
import { Prisma } from '@prisma/client'
import { getMetadata, parseSort } from '#app/utils/request.server.js'
import {
	getMaxTransactionAmount,
	getMinTransactionAmount,
	getUserTransaction,
} from '../history+/transaction.server'
import { useLoaderData } from '@remix-run/react'
import DataTable from '#app/components/data-table/data-table.js'
import { Icon } from '#app/components/ui/icon.js'
import { toast } from 'sonner'
import FilterItem from '../history+/filter'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const metadata = getMetadata(request)
	const { search, min, max, needReview: _needReview, reviewer, sort } = metadata
	const needReviewBool = _needReview === 'false'
	const needReview = _needReview === 'all' ? undefined : _needReview
	const sortObj = parseSort(sort)

	const where: Prisma.TransactionsWhereInput = {
		AND: [
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
	const recentTransactions = await getUserTransaction(metadata, where, sortObj)
	const totals = await prisma.transactions.count({ where })
	const [minV, maxV] = await Promise.all([
		getMinTransactionAmount(),
		getMaxTransactionAmount(),
	])

	metadata.totals = totals
	metadata.min = minV?.amount
	metadata.max = maxV?.amount
	metadata.filter = {
		min,
		max,
	}
	metadata.reviewer = reviewer && recentTransactions[0]?.reviewBy
	console.log(metadata)

	return json({
		metadata,
		transactions: recentTransactions,
	})
}
function TransactionPage() {
	const { transactions, metadata } = useLoaderData<typeof loader>()
	return (
		<div>
			<div className="container mt-24 space-y-4 lg:mt-5">
				<DataTable
					metadata={metadata as any}
					withPagination
					title={`History Transaction`}
					description={`Showing ${metadata.take}/${metadata.totals} transactions`}
					emptyRender={<EmptyTable />}
					columns={historyColumnDef}
					className="max-h-[500px] w-full overflow-y-auto"
					data={transactions as unknown as any}
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
		</div>
	)
}

export default TransactionPage
