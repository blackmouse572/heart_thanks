import { type DialogProps } from '@radix-ui/react-dialog'
import { button, gradientCard } from '@tailus/themer'
import { Command as CommandPrimitive } from 'cmdk'
import * as React from 'react'

import Button, { type ButtonProps } from '#app/components/ui/button.js'
import Dialog from '#app/components/ui/dialog.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { cn } from '#app/utils/misc.tsx'

const Command = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => {
	return (
		<CommandPrimitive
			ref={ref}
			className={cn(
				'flex h-full w-full flex-col overflow-hidden rounded-[--btn-radius] border',
				className,
			)}
			{...props}
		/>
	)
})
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
	const { inner } = gradientCard({
		variant: 'soft',
	})
	return (
		<Dialog.Root {...props}>
			<Dialog.Portal>
				<Dialog.Overlay />
				<Dialog.Content
					className={inner({ className: 'overflow-hidden p-0 shadow-lg' })}
				>
					<Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
						{children}
					</Command>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}

const CommandInput = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Input>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
		isLoading?: boolean
	}
>(({ className, isLoading, ...props }, ref) => (
	<div className="flex items-center border-b px-3" cmdk-input-wrapper="">
		<Icon
			name="magnifying-glass"
			className="mr-2 h-4 w-4 shrink-0 opacity-50"
		/>
		<CommandPrimitive.Input
			ref={ref}
			className={cn(
				'placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
		/>
		{isLoading && (
			<Icon
				name="loader-quarter"
				className="h-4 w-4 shrink-0 animate-spin opacity-50"
			/>
		)}
	</div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.List
		ref={ref}
		className={cn(
			'max-h-[300px] space-y-2 overflow-y-auto overflow-x-hidden',
			className,
		)}
		{...props}
	/>
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Empty>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
	<CommandPrimitive.Empty
		ref={ref}
		className="py-6 text-center text-sm"
		{...props}
	/>
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Group>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Group
		ref={ref}
		className={cn(
			'text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
			className,
		)}
		{...props}
	/>
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Separator
		ref={ref}
		className={cn('bg-border -mx-1 h-px', className)}
		{...props}
	/>
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Item & ButtonProps>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> &
		Omit<ButtonProps, 'asChild' | 'onSelect'>
>(({ className, ...props }, ref) => {
	const {} = button.solid({
		intent: 'accent',
	})
	return (
		<CommandPrimitive.Item
			ref={ref}
			// className={cn(
			// 	'aria-selected:bg-accent aria-selected:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-primary-900 data-[disabled="true"]:pointer-events-none data-[disabled="true"]:opacity-50',
			// 	className,
			// )}
			asChild
			{...props}
		>
			<Button.Root className="h-auto min-h-fit w-full items-center justify-start rounded-none last:rounded-b-[--btn-radius]">
				{props.children}
			</Button.Root>
		</CommandPrimitive.Item>
	)
})

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span
			className={cn(
				'text-muted-foreground ml-auto text-xs tracking-widest',
				className,
			)}
			{...props}
		/>
	)
}
CommandShortcut.displayName = 'CommandShortcut'

export {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
}
