import { TooltipProps } from '@tailus/themer'
import TooltipPrimative, { TooltipProvider } from './ui/tooltip.tsx'
import { cn } from '#app/utils/misc.js'

export type TooltipProp = {
	children: React.ReactNode
	content: React.ReactNode
	contentProps?: React.ComponentProps<typeof TooltipPrimative.Content>
} & React.ComponentProps<typeof TooltipPrimative.Root>
function Tooltip({ children, content, contentProps, ...props }: TooltipProp) {
	return (
		<TooltipPrimative.Provider>
			<TooltipPrimative.Root delayDuration={100} {...props}>
				<TooltipPrimative.Trigger type="button">
					{children}
				</TooltipPrimative.Trigger>
				<TooltipPrimative.Portal>
					<TooltipPrimative.Content
						{...contentProps}
						className={cn('z-[12]', contentProps?.className)}
					>
						{content}
					</TooltipPrimative.Content>
				</TooltipPrimative.Portal>
			</TooltipPrimative.Root>
		</TooltipPrimative.Provider>
	)
}

export default Tooltip
