import {
	FieldMetadata,
	getFieldsetProps,
	getFormProps,
	getInputProps,
	useField,
	useForm,
	useInputControl,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type User } from '@prisma/client'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import {
	Await,
	defer,
	Form,
	useActionData,
	useLoaderData,
	useNavigation,
	useSearchParams,
} from '@remix-run/react'
import React, { useCallback, useEffect } from 'react'
import { z } from 'zod'
import { Field } from '#app/components/forms.tsx'
import Button from '#app/components/ui/button.js'
import { Caption } from '#app/components/ui/typography/caption.js'
import { Card } from '#app/components/ui/card.tsx'
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from '#app/components/ui/command.js'
import { Display } from '#app/components/ui/typography/display.js'
import { Icon } from '#app/components/ui/icon.js'
import Popover from '#app/components/ui/popover.tsx'
import { Text } from '#app/components/ui/typography/text.js'
import { Title } from '#app/components/ui/typography/title.js'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.js'
import { cn, getUserImgSrc } from '#app/utils/misc.js'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { checkHoneypot } from '#app/utils/honeypot.server.js'
import { transferHandler } from './transfer.server'
import Banner from '#app/components/ui/banner.js'
import { redirectWithToast } from '#app/utils/toast.server.js'
import Label from '#app/components/ui/typography/label.js'

const TransferSchema = z.object({
	amount: z.number(),
	recipientId: z.string(),
	reviewerId: z.string(),
	title: z.string().min(3).max(100),
	description: z.string().max(1024).optional(),
})
export async function loader({ request }: LoaderFunctionArgs) {
	// require the user to be logged in
	// if they are not, this will redirect them to the login page
	const userId = await requireUserId(request, {
		redirectTo: '/login',
	})
	const user = await prisma.user.findUnique({ where: { id: userId } })
	const others = prisma.user
		.findMany({
			where: {
				NOT: {
					id: userId,
				},
			},
			include: {
				image: {
					select: {
						id: true,
						altText: true,
					},
				},
			},
		})
		.then((u) => u)

	return defer({ user, others })
}

export async function action({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	let receiver: User, sender: User
	let amount: number
	checkHoneypot(formData)
	const submission = await parseWithZod(formData, {
		schema: (intent) =>
			TransferSchema.transform(async (data, ctx) => {
				if (intent !== null) return { ...data, session: null }

				const [senderUser, receiverUser] = await Promise.all([
					prisma.user.findUnique({ where: { id: userId } }),
					prisma.user.findUnique({
						where: { id: data.recipientId },
					}),
				])
				if (!senderUser || !receiverUser) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Invalid user',
					})
					return z.NEVER
				}

				// assign the sender and receiver to the outer scope
				sender = senderUser
				receiver = receiverUser
				amount = data.amount

				if (senderUser?.points < data.amount) {
					ctx.addIssue({
						code: z.ZodIssueCode.too_big,
						maximum: senderUser.points,
						inclusive: true,
						type: 'number',
						path: ['amount'],
						message: 'Insufficient points',
					})
					return z.NEVER
				}

				return { ...data }
			}),
		async: true,
	})
	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply(), message: '' },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}
	try {
		await transferHandler({
			sender: sender!,
			receiver: receiver!,
			amount: amount!,
		})
		return redirectWithToast('/transfer', {
			title: 'Transfer Successful',
			description: `You have successfully transferred ${amount!} points to ${receiver!.username}`,
			type: 'success',
		})
	} catch (e) {
		console.error(e)
		return redirectWithToast('/transfer', {
			title: 'Transfer Failed',
			description: 'An error occurred while transferring points',
			type: 'error',
		})
	}
}

function TransferPage() {
	const { others, user } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const isSubmitting =
		navigation.state !== 'idle' || navigation.formAction === '/transfer'
	const [form, fields] = useForm({
		id: 'transfer-form',
		constraint: getZodConstraint(TransferSchema),
		lastResult: actionData?.result as any,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: TransferSchema })
		},
		shouldRevalidate: 'onBlur',
	})
	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
			<Card variant="outlined">
				<div className="space-y-4">
					<div className="space-y-2">
						<Title as="h2" size="lg" weight="medium" className="mb-1">
							Transfer Your Heart 💖
						</Title>
						<Text size="sm">
							Appriciate the love and support from your colleagues
						</Text>
					</div>
					<ErrorAlert actionData={actionData} />
				</div>

				<div className="mt-6 grid gap-6 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
					<div className="">
						<Caption as="span">Your balance</Caption>
						<div className="mt-2 flex items-center justify-between gap-3">
							<Display as="span">{user?.points}️</Display>
							<div className="flex items-center gap-1.5 [--body-text-color:theme(colors.success.600)] dark:[--body-text-color:theme(colors.success.400)]"></div>
						</div>
					</div>
					<div className="w-full pt-6 sm:pl-6 sm:pt-0">
						<Caption as="span">New Customers</Caption>
						<Form action="/transfer" method="post" {...getFormProps(form)}>
							<HoneypotInputs />
							<fieldset disabled={isSubmitting} className="space-y-8">
								<Field
									labelProps={{
										htmlFor: fields.title.id,
										children: 'Title',
									}}
									inputProps={{
										...getInputProps(fields.title, {
											type: 'text',
										}),
										autoComplete: 'title',
										className: 'lowercase',
										required: true,
									}}
									errors={fields.amount.errors}
								/>
								<Field
									labelProps={{
										htmlFor: fields.description.id,
										children: 'Description',
									}}
									inputProps={{
										...getInputProps(fields.description, { type: 'text' }),
										autoComplete: 'description',
										className: 'lowercase',
									}}
									errors={fields.amount.errors}
								/>
								<Field
									labelProps={{
										htmlFor: fields.amount.id,
										children: 'Amount',
									}}
									inputProps={{
										...getInputProps(fields.amount, { type: 'number' }),
										autoComplete: 'amount',
										className: 'lowercase',
										max: user?.points,
										min: 1,
									}}
									errors={fields.amount.errors}
								/>
								<React.Suspense fallback={<p>loading</p>}>
									<Await resolve={others} errorElement={<p>Error</p>}>
										{(users) => {
											return (
												<>
													<UserSelector
														field={fields.recipientId}
														label={'Recipient'}
														labelProps={{ htmlFor: fields.recipientId.id }}
														users={users as any}
													/>
												</>
											)
										}}
									</Await>
								</React.Suspense>

								<Button.Root
									type="submit"
									variant="solid"
									intent="primary"
									className="flex-end"
								>
									<Button.Label>Transfer</Button.Label>
								</Button.Root>
							</fieldset>
						</Form>
					</div>
				</div>
			</Card>
		</div>
	)
}
function ErrorAlert({ actionData }: any) {
	const message = actionData?.message
	if (!message) return null
	return (
		<Banner.Root intent="danger" className="p-[--toast-padding]">
			<Banner.Content>
				<Icon name="bug" className="size-5 text-[--body-text-color]" />
				<div className="space-y-2">
					<Text size="sm" className="my-0 text-danger-800 dark:text-danger-300">
						{message}
					</Text>
				</div>
			</Banner.Content>
		</Banner.Root>
	)
}
type UserSelectorProps = {
	users: (User & { image: { id: string } })[]
	field: FieldMetadata
	label: string
	labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>
}
function UserSelector({ field, users, label, labelProps }: UserSelectorProps) {
	const [open, setOpen] = React.useState(false)
	const [value, setValue] = React.useState(users[0]?.id ?? '')
	const [searchParams, setSearchParams] = useSearchParams()
	const control = useInputControl(field as any)

	const currentUser = users?.find((user) => user.id === value)

	useEffect(() => {
		// sync
		control.change(value)
	}, [])

	useEffect(() => {
		const to = searchParams.get('to')
		if (!to) return
		const user = users.find((u) => u.username === to)
		if (user) {
			setValue(user.id)
		}
	}, [searchParams])

	const onChange = useCallback((newValue: string) => {
		const [id] = newValue.split('|')
		const fallback = id ?? users[0]!.id
		setValue(fallback)
		setOpen(false)
		control.change(fallback)
	}, [])

	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger asChild>
				<div>
					<Label {...labelProps}>{label}</Label>
					<Button.Root
						size="lg"
						aria-expanded={open}
						variant="outlined"
						className="h-auto min-h-9 w-[400px] justify-between overflow-hidden"
					>
						<Button.Label>
							{currentUser ? (
								<div className="flex items-center justify-start gap-8 py-2">
									<img
										src={getUserImgSrc(currentUser.image.id)}
										alt={currentUser.name ?? currentUser.username}
										className="h-6 w-6 rounded-full"
									/>
									<div className="text-start">
										<Text>{currentUser.name}</Text>
										<Caption>{currentUser.username}</Caption>
									</div>
								</div>
							) : (
								'Select User...'
							)}
						</Button.Label>
						<Button.Icon>
							<Icon
								name="chevron-down"
								className="ml-2 h-4 w-4 shrink-0 opacity-50"
							/>
						</Button.Icon>
					</Button.Root>
				</div>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content className="w-[300px] p-0" sideOffset={15}>
					<Command>
						<CommandInput placeholder="Search user..." />
						<CommandEmpty>No users found.</CommandEmpty>
						<CommandList>
							{users?.map((framework) => (
								<CommandItem
									key={framework.id}
									value={[
										framework.id,
										framework.username,
										framework.name,
									].join('|')}
									onSelect={onChange}
									aria-disabled={undefined}
									data-disabled={undefined}
									className="space-x-8"
									variant={value === framework.id ? 'soft' : 'ghost'}
								>
									<Icon
										name="check"
										className={cn(
											'h-4 w-4',
											value === framework.id ? 'opacity-100' : 'opacity-0',
										)}
									/>
									<img
										src={getUserImgSrc(framework.image?.id)}
										alt={framework.name ?? framework.username}
										className="h-6 w-6 rounded-full"
									/>
									<div className="text-start">
										<Text>{framework.name}</Text>
										<Caption>{framework.username}</Caption>
									</div>
								</CommandItem>
							))}
						</CommandList>
					</Command>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	)
}
export default TransferPage
