import * as React from 'react'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import { cn } from '#app/utils/misc.js'
import { popover, PopoverProps } from '@tailus/themer'

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
	React.ElementRef<typeof HoverCardPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> &
		PopoverProps
>(
	(
		{ className, align = 'center', fancy, mixed, sideOffset = 4, ...props },
		ref,
	) => {
		const { content } = popover()
		if (fancy && mixed) {
			throw new Error('The fancy and mixed props cannot be used together.')
		}

		return (
			<HoverCardPrimitive.Content
				ref={ref}
				align={align}
				sideOffset={sideOffset}
				className={content({
					fancy,
					mixed,
					className: cn(
						// 'bg-popover text-popover-foreground z-50 w-64 rounded-md border p-4 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
						className,
					),
				})}
				{...props}
			/>
		)
	},
)
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }

export default {
	Root: HoverCard,
	Trigger: HoverCardTrigger,
	Content: HoverCardContent,
}
