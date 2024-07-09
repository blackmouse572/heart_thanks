import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { Caption } from '#app/components/ui/caption.js'
import { Icon } from '#app/components/ui/icon.js'
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from '#app/components/ui/table/index.js'
import Card from '#app/components/ui/card.js'
import { Title } from '#app/components/ui/title.js'
import React, { useMemo } from 'react'
import ContextMenu from '#app/components/ui/context-menu.js'

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	title: string
	description?: React.ReactNode
}
export function DataTable<TData, TValue>({
	columns,
	data,
	title,
	description,
}: Readonly<DataTableProps<TData, TValue>>) {
	const [rowSelection, setRowSelection] = React.useState({})
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
	})

	return (
		<Card className="cursor-default rounded-[--btn-radius]">
			<div className="mb-4">
				<Title>{title}</Title>
				{description && <Caption>{description}</Caption>}
			</div>
			<RenderContenxtMenu>
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
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
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
				</Table>
			</RenderContenxtMenu>
		</Card>
	)
}
export default DataTable

export const RenderContenxtMenu = ({
	children,
}: {
	children: React.ReactNode
}) => (
	<ContextMenu.Root>
		<ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

		<ContextMenu.Portal>
			<ContextMenu.Content
				mixed
				data-shade="800"
				variant="solid"
				intent="primary"
				className="min-w-56"
			>
				<ContextMenu.Item>
					Scale <ContextMenu.Command>⌘S</ContextMenu.Command>
				</ContextMenu.Item>
				<ContextMenu.Item>
					Set to Primary <ContextMenu.Command>⌘P</ContextMenu.Command>
				</ContextMenu.Item>
				<ContextMenu.Separator />
				<ContextMenu.Item>Copy </ContextMenu.Item>
				<ContextMenu.Item>Share... </ContextMenu.Item>
				<ContextMenu.Separator />
				<ContextMenu.Sub>
					<ContextMenu.SubTrigger>
						Download
						<Icon name="download" className="ml-auto size-4" />
					</ContextMenu.SubTrigger>
					<ContextMenu.Portal>
						<ContextMenu.SubContent
							mixed
							data-shade="800"
							variant="solid"
							intent="primary"
							className="min-w-fit"
							sideOffset={2}
							alignOffset={-5}
						>
							<ContextMenu.Item>Logomark </ContextMenu.Item>
							<ContextMenu.Item>Logotype </ContextMenu.Item>
							<ContextMenu.Separator />
							<ContextMenu.Item>All </ContextMenu.Item>
						</ContextMenu.SubContent>
					</ContextMenu.Portal>
				</ContextMenu.Sub>
				<ContextMenu.Separator />
				<ContextMenu.Item disabled intent="warning">
					<ContextMenu.Icon>
						<Icon name="arrow-left" className="size-4" />
					</ContextMenu.Icon>
					Archive
					<ContextMenu.Command>⌘A</ContextMenu.Command>
				</ContextMenu.Item>
				<ContextMenu.Item intent="danger">
					<Icon name="trash" className="size-4" />
					Delete
					<ContextMenu.Command>⌘D</ContextMenu.Command>
				</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Portal>
	</ContextMenu.Root>
)
