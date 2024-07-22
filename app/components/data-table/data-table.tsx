import {
	type ContextMenuItem,
	RenderContenxtMenu,
} from '#app/components/data-table/context-menu.js'
import Card from '#app/components/ui/card.js'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table/index.js'
import { Caption } from '#app/components/ui/typography/caption.js'
import { Title } from '#app/components/ui/typography/title.js'
import { cn } from '#app/utils/misc.js'
import { Metadata } from '#app/utils/request.server.js'
import { useSearchParams, useSubmit } from '@remix-run/react'
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type RowSelectionState,
	type SortingState,
	type TableOptions,
	useReactTable,
} from '@tanstack/react-table'
import React, { useEffect, useImperativeHandle, useMemo } from 'react'
import { Icon } from '../ui/icon'
import TablePagination from './pagination'
import Button from '../ui/button'

type DataTableProps<TData, TValue> = Partial<TableOptions<TData>> & {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	emptyRender?: React.ReactNode
	title: string
	description?: React.ReactNode
	filter?: React.ReactNode
	actions?: ContextMenuItem<TData>[][]
	onSelectionChange?: (selected: RowSelectionState) => void
	className?: string
} & (
		| {
				withPagination: true
				metadata: Metadata
		  }
		| {
				withPagination: false
				metadata?: never
		  }
	)

export type DataTableRef = {
	deselectAll: () => void
}
function DataTable<TData, TValue>(
	{
		columns,
		data,
		filter,
		title,
		actions,
		emptyRender,
		description,
		withPagination,
		className,
		metadata,
		...options
	}: Readonly<DataTableProps<TData, TValue>>,
	ref: React.Ref<DataTableRef>,
) {
	const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [searchParams] = useSearchParams()
	const submit = useSubmit()
	const totalSelectCount = useMemo(
		() => Object.values(rowSelection).filter(Boolean).length,
		[rowSelection],
	)
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onRowSelectionChange: (selected) => {
			setRowSelection(selected)
			options.onSelectionChange?.(selected as any)
		},
		onSortingChange: setSorting,
		state: {
			rowSelection,
			sorting,
		},
		manualSorting: true,
		...options,
	})
	useImperativeHandle(ref, () => ({
		deselectAll: table.resetRowSelection,
	}))
	useEffect(() => {
		if (!sorting.length || sorting.length <= 0) return
		const formData = new FormData()
		formData.append('sort', JSON.stringify(sorting))

		// presist search params
		searchParams.forEach((value, key) => {
			if (key === 'sort') return
			formData.append(key, value)
		})

		submit(formData, { method: 'GET' })
	}, [sorting])
	const renderDescription = useMemo(() => {
		if (totalSelectCount > 0) {
			return (
				<div className="relative">
					<Caption className="">
						Selected <b>{totalSelectCount}</b> rows{' '}
					</Caption>
					<Button.Root
						size="xs"
						variant="ghost"
						intent="gray"
						onClick={() => table.resetRowSelection()}
						className="absolute -right-8 top-1/2 -translate-y-1/2"
					>
						<Button.Icon type="only">
							<Icon name="x" />
						</Button.Icon>
					</Button.Root>
				</div>
			)
		}
		return <Caption>{description}</Caption>
	}, [description, totalSelectCount])

	return (
		<Card className={cn('cursor-default rounded-[--btn-radius]')}>
			<div className="mb-4 flex items-end justify-between">
				<div>
					<Title>{title}</Title>
					{renderDescription}
				</div>
				<div>{filter}</div>
			</div>
			<div>
				<Table className={className}>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const sortable =
										header.column.columnDef.enableSorting !== false
									return (
										<TableHead
											key={header.id}
											onClick={header.column.getToggleSortingHandler()}
											className={cn(
												'relative [&_svg]:inset-0 [&_svg]:right-0 [&_svg]:m-auto',
												{
													'cursor-pointer': sortable,
													'': sortable,
												},
											)}
											data-sortable={sortable}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
											{{
												asc: (
													<Icon className={'absolute'} name="chevron-down" />
												),
												desc: <Icon className={'absolute'} name="chevron-up" />,
											}[header.column.getIsSorted() as string] || null}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<RenderContenxtMenu
						item={rowSelection as any}
						actions={actions || []}
					>
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
								<TableRow className="hover:bg-transparent">
									<TableCell colSpan={columns.length} className="h-full">
										{emptyRender || 'No data'}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</RenderContenxtMenu>
				</Table>
			</div>
			{withPagination && (
				<div className="mt-4">
					<TablePagination metadata={metadata} />
				</div>
			)}
		</Card>
	)
}
function fixedForwardRef<T, P = {}>(
	render: (props: P, ref: React.Ref<T>) => React.ReactNode,
): (props: P & React.RefAttributes<T>) => React.ReactNode {
	return React.forwardRef(render) as any
}
const DataTableRef = fixedForwardRef(DataTable)
export default DataTableRef
