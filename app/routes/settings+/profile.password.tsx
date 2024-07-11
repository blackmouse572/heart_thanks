import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import {
	json,
	redirect,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import {
	getPasswordHash,
	requireUserId,
	verifyUserPassword,
} from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { PasswordSchema } from '#app/utils/user-validation.ts'
import { type BreadcrumbHandle } from './profile.tsx'
import Button from '#app/components/ui/button.js'
import Card from '#app/components/ui/card.js'
import { Title } from '#app/components/ui/typography/title.js'
import { Caption } from '#app/components/ui/typography/caption.js'
import SeparatorRoot from '#app/components/ui/seperator.js'

export const handle: BreadcrumbHandle & SEOHandle = {
	breadcrumb: <Icon name="dots-horizontal">Password</Icon>,
	getSitemapEntries: () => null,
}

const ChangePasswordForm = z
	.object({
		currentPassword: PasswordSchema,
		newPassword: PasswordSchema,
		confirmNewPassword: PasswordSchema,
	})
	.superRefine(({ confirmNewPassword, newPassword }, ctx) => {
		if (confirmNewPassword !== newPassword) {
			ctx.addIssue({
				path: ['confirmNewPassword'],
				code: z.ZodIssueCode.custom,
				message: 'The passwords must match',
			})
		}
	})

async function requirePassword(userId: string) {
	const password = await prisma.password.findUnique({
		select: { userId: true },
		where: { userId },
	})
	if (!password) {
		throw redirect('/settings/profile/password/create')
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	await requirePassword(userId)
	return json({})
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	await requirePassword(userId)
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: ChangePasswordForm.superRefine(
			async ({ currentPassword, newPassword }, ctx) => {
				if (currentPassword && newPassword) {
					const user = await verifyUserPassword({ id: userId }, currentPassword)
					if (!user) {
						ctx.addIssue({
							path: ['currentPassword'],
							code: z.ZodIssueCode.custom,
							message: 'Incorrect password.',
						})
					}
				}
			},
		),
	})
	if (submission.status !== 'success') {
		return json(
			{
				result: submission.reply({
					hideFields: ['currentPassword', 'newPassword', 'confirmNewPassword'],
				}),
			},
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { newPassword } = submission.value

	await prisma.user.update({
		select: { username: true },
		where: { id: userId },
		data: {
			password: {
				update: {
					hash: await getPasswordHash(newPassword),
				},
			},
		},
	})

	return redirectWithToast(
		`/settings/profile`,
		{
			type: 'success',
			title: 'Password Changed',
			description: 'Your password has been changed.',
		},
		{ status: 302 },
	)
}

export default function ChangePasswordRoute() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'password-change-form',
		constraint: getZodConstraint(ChangePasswordForm),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ChangePasswordForm })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<Card variant="outlined" className="space-y-8">
			<div>
				<Title>Change password</Title>
				<Caption>
					Change the password you use to log in to your account.
				</Caption>
			</div>
			<SeparatorRoot />
			<Form method="POST" {...getFormProps(form)} className="space-y-4">
				<Field
					labelProps={{ children: 'Current Password' }}
					inputProps={{
						...getInputProps(fields.currentPassword, { type: 'password' }),
						autoComplete: 'current-password',
					}}
					errors={fields.currentPassword.errors}
				/>
				<Field
					labelProps={{ children: 'New Password' }}
					inputProps={{
						...getInputProps(fields.newPassword, { type: 'password' }),
						autoComplete: 'new-password',
					}}
					errors={fields.newPassword.errors}
				/>
				<Field
					labelProps={{ children: 'Confirm New Password' }}
					inputProps={{
						...getInputProps(fields.confirmNewPassword, {
							type: 'password',
						}),
						autoComplete: 'new-password',
					}}
					errors={fields.confirmNewPassword.errors}
				/>
				<ErrorList id={form.errorId} errors={form.errors} />
				<div className="grid w-full grid-cols-2 gap-6">
					<StatusButton
						type="submit"
						status={isPending ? 'pending' : form.status ?? 'idle'}
					>
						Change Password
					</StatusButton>
					<Button.Root href=".." variant="outlined">
						<Button.Label>Cancel</Button.Label>
					</Button.Root>
				</div>
			</Form>
		</Card>
	)
}
