import * as React from 'react'
import { useSpinDelay } from 'spin-delay'
import { cn } from '#app/utils/misc.tsx'
import Button, { type ButtonProps } from './button.tsx'
import { Icon } from './icon.tsx'
import Tooltip from '../tooltip.tsx'

export const StatusButton = React.forwardRef<
	HTMLButtonElement & HTMLAnchorElement,
	ButtonProps & {
		status: 'pending' | 'success' | 'error' | 'idle'
		type?: 'button' | 'submit' | 'reset'
		message?: string | null
		name?: string
		value?: string | number | readonly string[]
		spinDelay?: Parameters<typeof useSpinDelay>[1]
	}
>(({ message, status, className, children, spinDelay, ...props }, ref) => {
	const delayedPending = useSpinDelay(status === 'pending', {
		delay: 400,
		minDuration: 300,
		...spinDelay,
	})
	const companion = {
		pending: delayedPending ? (
			<Button.Icon type="trailing" role="status">
				<Icon name="update" className="animate-spin" title="loading" />
			</Button.Icon>
		) : null,
		success: (
			<Button.Icon type="trailing" role="status">
				<Icon name="check" title="success" />
			</Button.Icon>
		),
		error: (
			<Button.Icon type="trailing" role="status">
				<Icon
					name="cross-1"
					className="text-destructive-foreground"
					title="error"
				/>
			</Button.Icon>
		),
		idle: null,
	}[status]

	return (
		<Button.Root
			ref={ref}
			className={cn('flex justify-center gap-4', className)}
			{...props}
		>
			{children}
			{message ? <Tooltip content={message}>{companion}</Tooltip> : companion}
		</Button.Root>
	)
})
StatusButton.displayName = 'Button'
