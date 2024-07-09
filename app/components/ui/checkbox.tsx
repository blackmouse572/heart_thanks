import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import {
	checkbox,
	fancyCheckbox,
	type CheckboxProps as CheckboxVariants,
} from '@tailus/themer'
import React, { forwardRef } from 'react'
import { cn } from '#app/utils/misc.js'

export interface CheckboxProps
	extends CheckboxVariants,
		Omit<
			React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
			'className'
		> {
	className?: string
	fancy?: boolean
}
const CheckboxRoot = forwardRef<
	React.ElementRef<typeof CheckboxPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & CheckboxProps
>(({ className, intent, fancy, ...props }: CheckboxProps, forwardedRef) => {
	const classes = fancy
		? fancyCheckbox({ intent, className })
		: checkbox({ intent, className })
	return (
		<CheckboxPrimitive.Root
			ref={forwardedRef}
			className={cn(
				'group peer flex size-[1.125rem] items-center justify-center rounded border text-white shadow-sm outline-2 outline-offset-2 outline-primary-600 hover:brightness-95 focus-visible:outline disabled:border-gray-300 disabled:bg-gray-100 disabled:opacity-50 disabled:shadow-none data-[state=checked]:border-none data-[state=indeterminate]:border-none data-[state=checked]:bg-primary-600 data-[state=indeterminate]:bg-primary-600 disabled:data-[state=checked]:bg-gray-300 disabled:data-[state=indeterminate]:bg-gray-300 disabled:data-[state=checked]:shadow-none disabled:data-[state=indeterminate]:shadow-none dark:bg-gray-500/10 dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:data-[state=checked]:bg-gray-700 dark:disabled:data-[state=indeterminate]:bg-gray-800',
				classes,
			)}
			{...props}
		/>
	)
})

const CheckboxIndicator = CheckboxPrimitive.Indicator

export { CheckboxIndicator, CheckboxRoot }

export default {
	Root: CheckboxRoot,
	Indicator: CheckboxIndicator,
}
