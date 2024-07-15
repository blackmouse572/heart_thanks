import SlidePanel from '#app/components/drawer.js'
import {
	Field,
	PasswordGenereteField,
	CheckboxField,
} from '#app/components/forms.js'
import { useIsPending } from '#app/utils/misc.js'
import { uppercaseFirstLetter } from '#app/utils/ui.js'
import { useForm, getFormProps, getInputProps } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { ApplicationSetting } from '@prisma/client'
import { useFetcher, useActionData, useLocation, Form } from '@remix-run/react'
import { useId, useEffect, useMemo } from 'react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { toast } from 'sonner'
import { loader as roleLoader } from './roles.tsx'
import { action, type LoaderDataUser } from './users.tsx'
import { CreateNewUserSchema } from './CreateUserPanel'
import { z } from 'zod'
import Label from '#app/components/ui/typography/label'
import Button from '#app/components/ui/button.js'

export const UpdateUserSchema = CreateNewUserSchema.omit({
	password: true,
})
	.partial()
	.extend({
		id: z.string(),
		password: z.string().optional(),
	})

type UpdateUserPanelProps = {
	settings: ApplicationSetting
	user: LoaderDataUser
	open: boolean
	setOpen: (open: boolean) => void
}

function UpdateUserPanel({
	settings,
	open,
	setOpen,
	user: _user,
}: UpdateUserPanelProps) {
	const fetcher = useFetcher<typeof roleLoader>()
	const user = useMemo(
		() => ({
			..._user,
			roles: _user.roles.map((r) => r.id),
			password: '',
		}),
		[],
	)
	const actionData = useActionData<typeof action>()
	const location = useLocation()
	const isPending = useIsPending()
	// const formState =
	const [form, fields] = useForm({
		id: 'edit-user',
		constraint: getZodConstraint(UpdateUserSchema),
		defaultValue: user,
		onValidate: ({ formData: values }) => {
			return parseWithZod(values, {
				schema: UpdateUserSchema,
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
			title="User details"
			description={`Edit user ${user.username ?? user.name}`}
			open={open}
			setOpen={setOpen}
			trigger={<></>}
		>
			<div className="flex max-w-md flex-1 flex-col overflow-y-auto">
				<Form
					{...getFormProps(form)}
					method="PUT"
					action={`/admin/users?${location.search}`}
					className="flex w-full flex-1 flex-col"
				>
					<input
						{...getInputProps(fields.id, {
							type: 'hidden',
						})}
					/>
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
								}),
								required: false,
								autoComplete: 'password',
								placeholder: '********************',
							}}
							errors={fields.password.errors}
						/>
						<Field
							labelProps={{
								htmlFor: fields.vault.id,
								children: 'Vaul',
							}}
							inputProps={{
								...getInputProps(fields.vault, {
									type: 'number',
								}),
								defaultValue: 0,
								min: 0,
								autoComplete: 'vaul',
								placeholder: '0',
							}}
							errors={fields.vault.errors}
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
								}),
								defaultValue: 30,
								autoComplete: 'balance',
								required: false,
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
											defaultChecked: user.roles.includes(role.id),
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
							<Button.Label>Update User</Button.Label>
						</Button.Root>
					</div>
				</Form>
			</div>
		</SlidePanel>
	)
}

export default UpdateUserPanel
