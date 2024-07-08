import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import {
	checkbox,
	fancyCheckbox,
	type CheckboxProps as CheckboxVariants,
} from '@tailus/themer'
import React, { forwardRef } from 'react'

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
		<CheckboxPrimitive.Root ref={forwardedRef} className={classes} {...props} />
	)
})

const CheckboxIndicator = CheckboxPrimitive.Indicator

export { CheckboxIndicator, CheckboxRoot }

export default {
	Root: CheckboxRoot,
	Indicator: CheckboxIndicator,
}
