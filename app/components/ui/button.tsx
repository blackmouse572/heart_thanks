// Button.tsx

import { cn } from '#app/utils/misc.js'
import { cloneElement } from '#app/utils/ui'
import { Link } from '@remix-run/react'
import {
	button,
	buttonIcon as icon,
	type ButtonIconProps,
	type ButtonProps as ButtonVariantsProps,
} from '@tailus/themer'
import React from 'react'

export type Root = typeof Root
export type Icon = typeof Icon
export type Label = typeof Label

export interface ButtonProps
	extends React.HTMLAttributes<HTMLButtonElement | HTMLAnchorElement>,
		ButtonVariantsProps {
	disabled?: boolean
	href?: string
	isIcon?: boolean
	type?: 'button' | 'submit' | 'reset'
}

export interface IconProps
	extends React.HTMLAttributes<HTMLElement>,
		ButtonIconProps {}

export const Icon: React.FC<IconProps> = ({
	className,
	children,
	size = 'md',
	type = 'leading',
}) => {
	return (
		<>
			{cloneElement(
				children as React.ReactElement,
				icon({ size, type, className: cn('ml-0', className) }),
			)}
		</>
	)
}

export const Label = React.forwardRef<
	HTMLElement,
	React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, forwardedRef) => {
	return (
		<span className={className} {...props} ref={forwardedRef}>
			{children}
		</span>
	)
})

export const Root = React.forwardRef<
	HTMLButtonElement & HTMLAnchorElement,
	ButtonProps
>(
	(
		{
			className,
			intent = 'primary',
			variant = 'solid',
			size = 'md',
			disabled,
			href,
			children,
			isIcon,
			type = 'button',
			...props
		},
		forwardedRef,
	) => {
		const isLink = href ? true : false
		const iconOnly =
			isIcon ||
			React.Children.toArray(children).some(
				(child) =>
					React.isValidElement(child) &&
					child.type === Icon &&
					child.props.type === 'only',
			)
		const buttonSize = iconOnly ? 'iconOnlyButtonSize' : 'size'

		if (isLink) {
			return (
				<Link
					to={href ?? '/'}
					className={button[variant as keyof typeof button]({
						intent,
						[buttonSize]: size,
						className: cn(className, {
							'aspect-square': iconOnly,
						}),
					})}
					{...props}
				>
					{children}
				</Link>
			)
		}

		return (
			<button
				ref={forwardedRef}
				type={type}
				className={button[variant as keyof typeof button]({
					intent,
					[buttonSize]: size,
					className: cn(className, {
						'aspect-square': iconOnly,
					}),
				})}
				{...props}
				disabled={disabled}
			>
				{children}
			</button>
		)
	},
)

Root.displayName = 'Root'
Icon.displayName = 'Icon'
Label.displayName = 'Label'

export default {
	Root: Root,
	Icon: Icon,
	Label: Label,
}
