import Checkbox, { CheckboxProps } from '#app/components/ui/checkbox'
import Label from '#app/components/ui/typography/label.js'
import { useField, useInputControl } from '@conform-to/react'
import { REGEXP_ONLY_DIGITS_AND_CHARS, type OTPInputProps } from 'input-otp'
import React, { useCallback, useId } from 'react'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from './ui/input-otp.tsx'
import Input, { type InputProps } from './ui/input.tsx'
import { Textarea } from './ui/textarea.tsx'
import { Icon } from './ui/icon.tsx'
import { cn } from '#app/utils/misc.js'
import Tooltip from './tooltip.tsx'
import Button from './ui/button.tsx'
import { Caption } from './ui/typography/caption.tsx'
import { Link } from './ui/typography/link.tsx'
import { useCopyToClipboard } from '#app/utils/hooks/useCopy.js'
import { toast } from 'sonner'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
	id,
	errors,
}: {
	errors?: ListOfErrors
	id?: string
}) {
	const errorsToRender = errors?.filter(Boolean)
	if (!errorsToRender?.length) return null
	return (
		<ul id={id} className="flex flex-col gap-1">
			{errorsToRender.map((e) => (
				<li key={e} className="text-[10px] text-danger-500">
					{e}
				</li>
			))}
		</ul>
	)
}

type FieldProps = {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: InputProps
	errors?: ListOfErrors
	className?: string
	explain?: string
}

export function Field({
	labelProps,
	inputProps,
	errors,
	className,
	explain,
}: FieldProps) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<div className="flex items-center gap-1">
				{explain && (
					<Tooltip
						contentProps={{
							className: 'max-w-sm',
							fancy: true,
							inverted: false,
						}}
						content={explain}
					>
						<Icon name="info-circle" className="text-[--caption-text-color]" />
					</Tooltip>
				)}

				<Label
					htmlFor={id}
					{...labelProps}
					className={cn('text-[--caption-text-color]', labelProps.className)}
				/>
				{inputProps.required && (
					<span className="text-danger-500" aria-hidden="true">
						*
					</span>
				)}
			</div>
			<Input
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			/>
			{errorId && (
				<div className="min-h-[32px] pb-3 pt-1 text-danger-500">
					<ErrorList id={errorId} errors={errors} />
				</div>
			)}
		</div>
	)
}
export function PasswordGenereteField({
	labelProps,
	inputProps,
	errors,
	className,
	explain,
}: FieldProps) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	const control = useInputControl({
		formId: inputProps.form!,
		name: inputProps.name!,
		key: inputProps.id,
	})
	const [value, copy] = useCopyToClipboard()
	const generatePassword = useCallback(() => {
		const newPassword = Math.random().toString(36).slice(2)
		control.change(newPassword)
		copy(newPassword)
		toast.success('Password copied to clipboard')
	}, [control])

	return (
		<div className={className}>
			<div className="relative flex items-center gap-1">
				{explain && (
					<Tooltip
						contentProps={{
							className: 'max-w-sm',
							fancy: true,
							inverted: false,
						}}
						content={explain}
					>
						<Icon name="info-circle" className="text-[--caption-text-color]" />
					</Tooltip>
				)}

				<Label
					htmlFor={id}
					{...labelProps}
					className={cn('text-[--caption-text-color]', labelProps.className)}
				/>
				{inputProps.required && (
					<span className="text-danger-500" aria-hidden="true">
						*
					</span>
				)}
			</div>
			<div className="relative">
				<Input
					id={id}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					{...inputProps}
				/>
				<div className="absolute right-2 top-1/2 -translate-y-1/2">
					<Tooltip content="Generate password">
						<Button.Root
							size="sm"
							variant="ghost"
							intent="gray"
							type="button"
							onClick={generatePassword}
						>
							<Button.Icon type="only">
								<Icon name="lock-closed" />
							</Button.Icon>
						</Button.Root>
					</Tooltip>
				</div>
			</div>
			{errorId && (
				<div className="pt-1 text-danger-500">
					<ErrorList id={errorId} errors={errors} />
				</div>
			)}
			{value && (
				<Caption>
					Generated password:{' '}
					<Link intent="secondary" size="sm">
						{value}
					</Link>
				</Caption>
			)}
		</div>
	)
}

export function OTPField({
	labelProps,
	inputProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: Partial<OTPInputProps & { render: never }>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<div className="flex items-center gap-1">
				<Label
					htmlFor={id}
					{...labelProps}
					className={cn('text-[--caption-text-color]', labelProps.className)}
				/>
				{inputProps.required && (
					<span className="text-danger-500" aria-hidden="true">
						*
					</span>
				)}
			</div>
			<InputOTP
				pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
				maxLength={6}
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			>
				<InputOTPGroup>
					<InputOTPSlot index={0} />
					<InputOTPSlot index={1} />
					<InputOTPSlot index={2} />
				</InputOTPGroup>
				<InputOTPSeparator />
				<InputOTPGroup>
					<InputOTPSlot index={3} />
					<InputOTPSlot index={4} />
					<InputOTPSlot index={5} />
				</InputOTPGroup>
			</InputOTP>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function TextareaField({
	labelProps,
	textareaProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = textareaProps.id ?? textareaProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<div className="flex items-center gap-1">
				<Label
					htmlFor={id}
					{...labelProps}
					className={cn('text-[--caption-text-color]', labelProps.className)}
				/>
				{textareaProps.required && (
					<span className="text-danger-500" aria-hidden="true">
						*
					</span>
				)}
			</div>
			<Textarea
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...textareaProps}
			/>
			{errorId ? (
				<div className="min-h-[32px] px-4 pb-3 pt-1">
					<ErrorList id={errorId} errors={errors} />
				</div>
			) : null}
		</div>
	)
}

export function CheckboxField({
	labelProps,
	buttonProps,
	errors,
	className,
}: {
	labelProps: JSX.IntrinsicElements['label']
	buttonProps: CheckboxProps & {
		name: string
		form: string
		value?: string
	}
	errors?: ListOfErrors
	className?: string
}) {
	const { key, defaultChecked, ...checkboxProps } = buttonProps
	const fallbackId = useId()
	const checkedValue = buttonProps.value ?? 'on'
	const input = useInputControl({
		key,
		name: buttonProps.name,
		formId: buttonProps.form,
		initialValue: defaultChecked ? checkedValue : undefined,
	})
	const id = buttonProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	return (
		<div className={className}>
			<div className="flex items-center gap-2">
				<Checkbox.Root
					{...checkboxProps}
					id={id}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					checked={input.value === checkedValue}
					onCheckedChange={(state) => {
						input.change(state.valueOf() ? checkedValue : '')
						buttonProps.onCheckedChange?.(state)
					}}
					onFocus={(event) => {
						input.focus()
						buttonProps.onFocus?.(event)
					}}
					onBlur={(event) => {
						input.blur()
						buttonProps.onBlur?.(event)
					}}
					type="button"
				>
					<Checkbox.Indicator asChild>
						<Icon className="size-3.5" name="check" />
					</Checkbox.Indicator>
				</Checkbox.Root>
				<Label
					htmlFor={id}
					{...labelProps}
					className="text-body-xs text-muted-foreground self-center"
				/>
			</div>
			{errorId ? (
				<div className="px-4 pb-3 pt-1">
					<ErrorList id={errorId} errors={errors} />
				</div>
			) : null}
		</div>
	)
}
