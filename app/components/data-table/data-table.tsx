import {
	ContextMenuItem,
	RenderContenxtMenu,
} from '#app/components/data-table/context-menu.js'
import { Caption } from '#app/components/ui/caption.js'
import Card from '#app/components/ui/card.js'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table/index.js'
import { Title } from '#app/components/ui/title.js'
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	RowSelectionState,
	TableOptions,
	useReactTable,
} from '@tanstack/react-table'
import React from 'react'

interface DataTableProps<TData, TValue> extends Partial<TableOptions<TData>> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	title: string
	description?: React.ReactNode
	filter?: React.ReactNode
	actions?: ContextMenuItem<TData>[][]
}

export function DataTable<TData, TValue>({
	columns,
	data,
	filter,
	title,
	actions,
	description,
	...options
}: Readonly<DataTableProps<TData, TValue>>) {
	const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
		...options,
	})

	return (
		<Card className="cursor-default rounded-[--btn-radius]">
			<div className="mb-4 flex items-end justify-between">
				<div>
					<Title>{title}</Title>
					{description && <Caption>{description}</Caption>}
				</div>
				<div>{filter}</div>
			</div>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								)
							})}
						</TableRow>
					))}
				</TableHeader>
				<RenderContenxtMenu item={rowSelection as any} actions={actions || []}>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
									onContextMenu={() => {
										const isSelected = row.getIsSelected()
										if (!isSelected) row.toggleSelected()
									}}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											onClick={() => {
												if (
													['action', 'checkbox'].includes(
														cell.column.columnDef.id || '',
													)
												)
													return

												row.toggleSelected()
											}}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</RenderContenxtMenu>
			</Table>
		</Card>
	)
}
export default DataTable
