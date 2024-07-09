import { cn } from '#app/utils/misc.js'
import * as React from 'react'

const Table = React.forwardRef<
	HTMLTableElement,
	React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
	<div className="relative w-full overflow-auto">
		<table
			ref={ref}
			className={cn('w-full caption-bottom text-sm', className)}
			{...props}
		/>
	</div>
))
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<thead
		ref={ref}
		className={cn(
			'w-full text-[--title-text-color] *:bg-[--ui-soft-bg] *:p-3 *:text-left *:font-medium',
			className,
		)}
		{...props}
	/>
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tbody
		ref={ref}
		className={cn('w-full [&_tr:last-child]:border-0', className)}
		{...props}
	/>
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tfoot
		ref={ref}
		className={cn(
			'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
			className,
		)}
		{...props}
	/>
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<
	HTMLTableRowElement,
	React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
	<tr
		ref={ref}
		className={cn(
			"group items-center border-b text-sm text-[--body-text-color] *:p-3 hover:bg-gray-50 has-[[data-state='checked']]:bg-[--ui-soft-bg] has-[[data-state='open']]:bg-gray-50 dark:hover:bg-gray-500/5 dark:has-[[data-state='open']]:bg-gray-500/5",
			className,
		)}
		{...props}
	/>
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
	HTMLTableCellElement,
	React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<th
		ref={ref}
		className={cn(
			'text-muted-foreground h-10 px-2 text-left align-middle font-medium first:rounded-l-[--card-radius] last:rounded-r-[--card-radius] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
			className,
		)}
		{...props}
	/>
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
	HTMLTableCellElement,
	React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<td
		ref={ref}
		className={cn(
			'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
			className,
		)}
		{...props}
	/>
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
	HTMLTableCaptionElement,
	React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
	<caption
		ref={ref}
		className={cn('text-muted-foreground mt-4 text-sm', className)}
		{...props}
	/>
))
TableCaption.displayName = 'TableCaption'

export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
}
