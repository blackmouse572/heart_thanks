import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import Button from './button'

export const Root = ({
	isActive = false,
	link,
	children,
}: {
	isActive?: boolean
	children: ReactNode
	link: string
}) => (
	<Button.Root
		href={link}
		variant={isActive ? 'outlined' : 'ghost'}
		intent="gray"
		className={twMerge(
			'justify-start gap-3.5 px-4',
			isActive &&
				'bg-white dark:bg-gray-500/10 dark:!shadow-none dark:[--btn-border-color:theme(colors.transparent)]',
		)}
	>
		{children}
	</Button.Root>
)

export const Icon = ({ children }: { children: ReactNode }) => (
	<Button.Icon size="sm" type="leading">
		{children}
	</Button.Icon>
)

export const Label = ({ children }: { children: ReactNode }) => (
	<Button.Label className="text-sm">{children}</Button.Label>
)
