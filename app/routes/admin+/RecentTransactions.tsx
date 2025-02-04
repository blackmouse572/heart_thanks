import DataTable from '#app/components/data-table/data-table.js'
import { Caption } from '#app/components/ui/typography/caption.js'
import { historyColumnDef, HistoryData } from '../history+'
import { Link } from '@remix-run/react'

type RecentTransactionsProps = {
	data: HistoryData[]
}
const columnDef = [
	...historyColumnDef
		.map((a) => {
			// note: this is a hack to disable sorting
			if (a.header === 'ID') {
				return {
					...a,
					cell: (row) => {
						return (
							<Link to={`/history/${row.getValue()}`}>
								<Caption>{row.getValue()}</Caption>
							</Link>
						)
					},
				}
			}
			return { ...a, enableSorting: false }
		})
		.filter((a) => a.id !== 'select'),
]
function RecentTransactions({ data }: RecentTransactionsProps) {
	return (
		<DataTable
			withPagination={false}
			columns={columnDef}
			enableRowSelection={false}
			data={data}
			title={'Recent Transaction'}
			className="max-h-[50vh] overflow-y-auto"
		/>
	)
}

export default RecentTransactions
