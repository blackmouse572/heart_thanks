import SlidePanel from '#app/components/drawer.js'
import {
	CheckboxField,
	Field,
	PasswordGenereteField,
} from '#app/components/forms.js'
import Button from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { useIsPending } from '#app/utils/misc.js'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form, useActionData, useFetcher, useLocation } from '@remix-run/react'
import { useEffect, useId, useState } from 'react'
import { z } from 'zod'
import { action } from './users.tsx'

export const CreateNewUserSchema = z.object({
	username: z.string().min(3).max(20),
	email: z.string().email(),
	password: z.string().min(8),
	roles: z.array(z.string()),
	name: z.string().min(3).max(255),
	balance: z.number().int().min(0),
	vaul: z.number().int().min(0).default(0),
})
import { ApplicationSetting } from '@prisma/client'
import { loader as roleLoader } from './roles.tsx'
import Label from '#app/components/ui/typography/label.js'
import { uppercaseFirstLetter } from '#app/utils/ui.js'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { toast } from 'sonner'
type CreateUserPanelProps = {
	settings: ApplicationSetting
}
function CreateUserPanel({ settings }: CreateUserPanelProps) {
	const fetcher = useFetcher<typeof roleLoader>()
	const [isOpen, setOpen] = useState(false)
	const actionData = useActionData<typeof action>()
	const location = useLocation()
	const isPending = useIsPending()
	// const formState =
	const [form, fields] = useForm({
		id: 'create-user',
		constraint: getZodConstraint(CreateNewUserSchema),
		onValidate: ({ formData: values }) => {
			return parseWithZod(values, {
				schema: CreateNewUserSchema,
			})
		},
		lastResult: actionData?.user as any,
		shouldValidate: 'onBlur',
	})
	const id = useId()

	useEffect(() => {
		fetcher.load('/admin/roles')
	}, [])

	useEffect(() => {
		if ((actionData as any)?.user?.id) {
			toast.success('Create new user')
			setOpen(false)
		}
	}, [actionData])

	return (
		<SlidePanel
			title="Create User"
			description="Create a new user account."
			open={isOpen}
			setOpen={setOpen}
			trigger={
				<Button.Root>
					<Button.Icon type="leading">
						<Icon name="plus" />
					</Button.Icon>
					<Button.Label>Create User</Button.Label>
				</Button.Root>
			}
		>
			<div className="flex max-w-md flex-1 flex-col overflow-y-auto">
				<Form
					{...getFormProps(form)}
					method="POST"
					action={`/admin/users?${location.search}`}
					className="flex w-full flex-1 flex-col"
				>
					<div className="w-full flex-1 space-y-4">
						<HoneypotInputs />
						<Field
							labelProps={{
								htmlFor: fields.username.id,
								id,
								children: 'Username',
							}}
							inputProps={{
								...getInputProps(fields.username, {
									type: 'text',
									required: true,
								}),
								autoComplete: 'username',
								autoFocus: true,
								placeholder: 'jaden.nguyen',
							}}
							errors={fields.username.errors}
						/>
						<Field
							labelProps={{
								htmlFor: fields.name.id,
								id,
								children: 'Full name',
							}}
							inputProps={{
								...getInputProps(fields.name, {
									type: 'text',
									required: true,
								}),
								autoComplete: 'full name',
								placeholder: 'Jaden Nguyen',
							}}
							errors={fields.name.errors}
						/>
						<Field
							labelProps={{
								htmlFor: fields.email.id,
								children: 'Email',
							}}
							inputProps={{
								...getInputProps(fields.email, {
									type: 'email',
									required: true,
								}),
								autoComplete: 'email',
								placeholder: 'jaden.depzai@example.com',
							}}
							errors={fields.email.errors}
						/>
						<PasswordGenereteField
							labelProps={{
								htmlFor: fields.password.id,
								children: 'Password',
							}}
							inputProps={{
								...getInputProps(fields.password, {
									type: 'password',
									required: true,
								}),
								autoComplete: 'password',
								placeholder: '********************',
							}}
							errors={fields.password.errors}
						/>
						<Field
							labelProps={{
								htmlFor: fields.vaul.id,
								children: 'Vaul',
							}}
							inputProps={{
								...getInputProps(fields.vaul, {
									type: 'number',
									required: true,
								}),
								defaultValue: 0,
								required: true,
								min: 0,
								autoComplete: 'vaul',
								placeholder: '0',
							}}
							errors={fields.vaul.errors}
							explain="Vaul is the amount of points a user can spend on the site. It is a virtual currency that can be used to purchase items in the store."
						/>
						<Field
							labelProps={{
								htmlFor: fields.balance.id,
								children: 'Balance',
							}}
							inputProps={{
								...getInputProps(fields.balance, {
									type: 'number',
									required: true,
								}),
								defaultValue: 30,
								autoComplete: 'balance',
								max: settings.averagePoints,
								min: 1,
								placeholder: '30',
							}}
							errors={fields.balance.errors}
						/>
						<div className="space-y-2">
							<Label htmlFor={fields.roles.id}>Roles</Label>
							<div className="grid grid-cols-3">
								{fetcher.data?.roles.map((role) => (
									<CheckboxField
										key={role.id}
										labelProps={{
											children: uppercaseFirstLetter(role.name),
											htmlFor: `${fields.roles.id}-${role.id}`,
										}}
										buttonProps={{
											...(getInputProps(fields.roles, {
												type: 'checkbox',
											}) as any),
											id: `${fields.roles.id}-${role.id}`,
											value: role.id,
										}}
										errors={fields.roles.errors}
									/>
								))}
							</div>
						</div>
					</div>
					<div className="flex items-center justify-end gap-2 py-2">
						<Button.Root
							variant="outlined"
							intent="gray"
							type="reset"
							disabled={isPending}
						>
							<Button.Label>Reset</Button.Label>
						</Button.Root>
						<Button.Root type="submit" disabled={isPending}>
							<Button.Label>Create User</Button.Label>
						</Button.Root>
					</div>
				</Form>
			</div>
		</SlidePanel>
	)
}

export default CreateUserPanel
