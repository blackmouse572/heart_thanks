import ContextMenu from '#app/components/ui/context-menu.js'
import { MenuProps } from '@tailus/themer'
import { RowSelectionState } from '@tanstack/react-table'
import React, { useCallback } from 'react'

export interface ContextMenuItem<T> {
	label: string
	icon?: React.ReactNode
	command?: string
	disabled?: boolean
	className?: string
	onClick?: (item: RowSelectionState) => void
	mode?: 'single' | 'multiple'
	children?: ContextMenuItem<T>[]
	intent?: MenuProps['intent']
}

export type ContextMenuContentProps<T> = React.PropsWithChildren<
	{
		className?: string
		item?: RowSelectionState
		onClose?: () => void
		actions: ContextMenuItem<T>[][]
	} & MenuProps
>

export function RenderContenxtMenu<T>({
	children,
	className,
	item,
	onClose,
	actions,
	...menuProps
}: ContextMenuContentProps<T>) {
	const keys = Object.keys(item || {})
	const renderItem = useCallback(
		(action: ContextMenuItem<T>) => {
			// if mode is single but  item is array, then return null
			if (action.mode === 'single' && keys.length > 1) return null

			return (
				<ContextMenu.Item
					{...menuProps}
					intent={action.intent}
					key={action.label}
					disabled={action.disabled}
					onClick={() => action.onClick?.(item || {})}
				>
					{action.icon}
					{action.label}
					{action.command && (
						<>
							<ContextMenu.Command>{action.command}</ContextMenu.Command>
						</>
					)}
				</ContextMenu.Item>
			)
		},
		[keys],
	)

	return (
		<ContextMenu.Root>
			<ContextMenu.Trigger className="contents">{children}</ContextMenu.Trigger>

			<ContextMenu.Portal>
				<ContextMenu.Content
					mixed
					data-shade="800"
					variant="solid"
					intent="primary"
					className="min-w-56"
					{...menuProps}
				>
					{actions.map((group, i) => (
						<ContextMenu.Group>
							{group.map((action, j) => renderItem(action))}
						</ContextMenu.Group>
					))}
				</ContextMenu.Content>
			</ContextMenu.Portal>
		</ContextMenu.Root>
	)
}
