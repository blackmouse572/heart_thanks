import { Field } from '#app/components/forms.tsx'
import Button from '#app/components/ui/button.js'
import { Caption } from '#app/components/ui/caption.tsx'
import { Card } from '#app/components/ui/card.tsx'
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from '#app/components/ui/command.js'
import { Display } from '#app/components/ui/display.tsx'
import { Icon } from '#app/components/ui/icon.js'
import Popover from '#app/components/ui/popover.tsx'
import { Text } from '#app/components/ui/text.tsx'
import { Title } from '#app/components/ui/title.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.js'
import { cn, getUserImgSrc } from '#app/utils/misc.js'
import {
	getFieldsetProps,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { User } from '@prisma/client'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { defer, Form, useActionData, useLoaderData } from '@remix-run/react'
import React from 'react'
import { z } from 'zod'

const TransferSchema = z.object({
	amount: z.number(),
	recipientId: z.string(),
})
const waitFor = (ms: number) => new Promise((r) => setTimeout(r, ms))
export async function loader({ request }: LoaderFunctionArgs) {
	// require the user to be logged in
	// if they are not, this will redirect them to the login page
	const userId = await requireUserId(request, {
		redirectTo: '/login',
	})
	const user = await prisma.user.findUnique({ where: { id: userId } })
	const others = await prisma.user.findMany({
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

	return defer({ user, others })
}

export async function action({ request }: LoaderFunctionArgs) {
	return json(
		{
			result: {
				amount: 100,
				recipientId: '123',
			},
		},
		{ status: 200 },
	)
}

function TransferPage() {
	const { others, user } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
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
				<Title as="h2" size="lg" weight="medium" className="mb-1">
					Transfer Your Heart 💖
				</Title>
				<Text size="sm">
					Appriciate the love and support from your colleagues
				</Text>

				<div className="mt-6 grid gap-6 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
					<div className="">
						<Caption as="span">Your balance</Caption>
						<div className="mt-2 flex items-center justify-between gap-3">
							<Display as="span">{user?.points}️</Display>
							<div className="flex items-center gap-1.5 [--body-text-color:theme(colors.success.600)] dark:[--body-text-color:theme(colors.success.400)]"></div>
						</div>
					</div>
					<div className="w-full min-w-[500px] pt-6 sm:pl-6 sm:pt-0">
						<Caption as="span">New Customers</Caption>
						<Form
							action="/transfer"
							method="post"
							{...getFormProps(form)}
							className="space-y-8"
						>
							<Field
								labelProps={{
									htmlFor: fields.amount.toString(),
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
							<UserSelector
								users={others as unknown as User[]}
								onSelect={(user) => getFieldsetProps(fields.recipientId)}
							/>

							<Button.Root type="submit" variant="solid" intent="primary">
								<Button.Label>Transfer</Button.Label>
							</Button.Root>
						</Form>
					</div>
				</div>
				<UserSelector users={[]} onSelect={(user) => {}} />
			</Card>
		</div>
	)
}
type UserSelectorProps = {
	users: (User & { image: { id: string } })[]
	onSelect: (user: User) => void
}
function UserSelector({ onSelect, users }: UserSelectorProps) {
	const [open, setOpen] = React.useState(false)
	const [value, setValue] = React.useState(users[0]?.id ?? '')
	const currentUser = users.find((user) => user.id === value)
	if (!users?.length) return users.toString()
	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger asChild>
				<Button.Root
					size="lg"
					aria-expanded={open}
					variant="outlined"
					className="h-auto w-full justify-between"
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
							name="arrow-right"
							className="ml-2 h-4 w-4 shrink-0 opacity-50"
						/>
					</Button.Icon>
				</Button.Root>
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
									onSelect={(currentValue: string) => {
										const [id] = currentValue.split('|')
										setValue(id || users[0]!.id)
										setOpen(false)
									}}
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
