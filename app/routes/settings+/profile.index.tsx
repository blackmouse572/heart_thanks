import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { useFetcher, useLoaderData, useSearchParams } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field } from '#app/components/forms.tsx'
import Button from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId, sessionKey } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useDoubleCheck } from '#app/utils/misc.tsx'
import { authSessionStorage } from '#app/utils/session.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { NameSchema, UsernameSchema } from '#app/utils/user-validation.ts'
import { twoFAVerificationType } from './profile.two-factor.tsx'
import ScrollArea from '#app/components/ui/scroll-area.js'
import * as Link from '#app/components/ui/link.js'
import Card from '#app/components/ui/card.js'
import { TabSections } from '#app/components/tab-sections.js'
import UserAvatar from '#app/components/user-avatar.js'
import Banner from '#app/components/ui/banner.js'
import { Text } from '#app/components/ui/typography/text.js'
import { useMemo } from 'react'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

const ProfileFormSchema = z.object({
	name: NameSchema.optional(),
	username: UsernameSchema,
})

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			username: true,
			email: true,
			image: {
				select: { id: true },
			},
			_count: {
				select: {
					sessions: {
						where: {
							expirationDate: { gt: new Date() },
						},
					},
				},
			},
		},
	})

	const twoFactorVerification = await prisma.verification.findUnique({
		select: { id: true },
		where: { target_type: { type: twoFAVerificationType, target: userId } },
	})

	const password = await prisma.password.findUnique({
		select: { userId: true },
		where: { userId },
	})

	return json({
		user,
		hasPassword: Boolean(password),
		isTwoFactorEnabled: Boolean(twoFactorVerification),
	})
}

type ProfileActionArgs = {
	request: Request
	userId: string
	formData: FormData
}
const profileUpdateActionIntent = 'update-profile'
const signOutOfSessionsActionIntent = 'sign-out-of-sessions'
const deleteDataActionIntent = 'delete-data'

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')
	switch (intent) {
		case profileUpdateActionIntent: {
			return profileUpdateAction({ request, userId, formData })
		}
		case signOutOfSessionsActionIntent: {
			return signOutOfSessionsAction({ request, userId, formData })
		}
		case deleteDataActionIntent: {
			return deleteDataAction({ request, userId, formData })
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 })
		}
	}
}

export default function EditUserProfile() {
	const data = useLoaderData<typeof loader>()

	const [search] = useSearchParams()

	const tabData = useMemo(
		() => [
			{
				trigger: {
					id: 'Profile',
					value: 'Profile',
				},
				content: {
					value: 'Profile',
					render: (
						<div className="w-full space-y-4">
							<div className="item-center flex justify-between">
								<UserAvatar
									imageId={data.user.image?.id}
									title={data.user.username}
								/>
								<Button.Root
									// preventScrollReset
									href="photo"
									aria-label="Change profile photo"
									variant="ghost"
								>
									<Button.Icon type="only">
										<Icon name="camera" className="h-4 w-4" />
									</Button.Icon>
								</Button.Root>
							</div>
							<UpdateProfile />
						</div>
					),
				},
			},
			{
				trigger: {
					id: 'Setting',
					value: 'Setting',
				},
				content: {
					value: 'Setting',
					render: (
						<div className="w-full">
							<ScrollArea.Root className="w-full">
								<ScrollArea.Viewport className="w-full">
									<div className="col-span-full flex flex-col gap-6">
										<div>
											<Link.Root to="change-email">
												<Link.Icon>
													<Icon name="envelope-closed">
														Change email from {data.user.email}
													</Icon>
												</Link.Icon>
											</Link.Root>
										</div>
										<div>
											<Link.Root to="two-factor">
												{data.isTwoFactorEnabled ? (
													<>
														<Link.Icon>
															<Icon name="lock-closed" />
														</Link.Icon>
														<Link.Label>2FA is enabled</Link.Label>
													</>
												) : (
													<>
														<Link.Icon>
															<Icon name="lock-open-1" />
														</Link.Icon>
														<Link.Label>Enable 2FA</Link.Label>
													</>
												)}
											</Link.Root>
										</div>
										<div>
											<Link.Root
												to={data.hasPassword ? 'password' : 'password/create'}
											>
												<Link.Icon>
													<Icon name="dots-horizontal" />
												</Link.Icon>
												<Link.Label>
													{data.hasPassword
														? 'Change Password'
														: 'Create a Password'}
												</Link.Label>
											</Link.Root>
										</div>
										<div>
											<Link.Root to="connections">
												<Link.Icon>
													<Icon name="link-2" />
												</Link.Icon>
												<Link.Label>Manage connections</Link.Label>
											</Link.Root>
										</div>
										<SignOutOfSessions />
										<DeleteData />
									</div>
								</ScrollArea.Viewport>
							</ScrollArea.Root>
						</div>
					),
				},
			},
			{
				trigger: {
					id: 'off',
					value: 'off',
				},
				content: {
					value: 'off',
					render: <div className="w-full">Setting</div>,
				},
			},
		],
		[],
	)

	const defaultTab = useMemo(() => {
		const tab = search.get('tab')
		if (tab) {
			const tabValue =
				tabData.find((tabData) => tabData.trigger.value === tab) ?? tabData[0]
			return tabValue!.trigger.value
		}
		return tabData[0]!.trigger.value
	}, [search])
	return (
		<div>
			<Card>
				<TabSections defaultKey={defaultTab} data={tabData} />
			</Card>
		</div>
	)
}

async function profileUpdateAction({ userId, formData }: ProfileActionArgs) {
	const submission = await parseWithZod(formData, {
		async: true,
		schema: ProfileFormSchema.superRefine(async ({ username }, ctx) => {
			const existingUsername = await prisma.user.findUnique({
				where: { username },
				select: { id: true },
			})
			if (existingUsername && existingUsername.id !== userId) {
				ctx.addIssue({
					path: ['username'],
					code: z.ZodIssueCode.custom,
					message: 'A user already exists with this username',
				})
			}
		}),
	})
	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const data = submission.value

	await prisma.user.update({
		select: { username: true },
		where: { id: userId },
		data: {
			name: data.name,
			username: data.username,
		},
	})

	return json({
		result: submission.reply(),
	})
}

function UpdateProfile() {
	const data = useLoaderData<typeof loader>()

	const fetcher = useFetcher<typeof profileUpdateAction>()

	const [form, fields] = useForm({
		id: 'edit-profile',
		constraint: getZodConstraint(ProfileFormSchema),
		lastResult: fetcher.data?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ProfileFormSchema })
		},
		defaultValue: {
			username: data.user.username,
			name: data.user.name,
		},
	})

	return (
		<fetcher.Form method="POST" {...getFormProps(form)}>
			<div className="grid grid-cols-6 gap-x-10">
				<Field
					className="col-span-3"
					labelProps={{
						htmlFor: fields.username.id,
						children: 'Username',
					}}
					inputProps={getInputProps(fields.username, { type: 'text' })}
					errors={fields.username.errors}
				/>
				<Field
					className="col-span-3"
					labelProps={{ htmlFor: fields.name.id, children: 'Name' }}
					inputProps={getInputProps(fields.name, { type: 'text' })}
					errors={fields.name.errors}
				/>
			</div>

			<ErrorList errors={form.errors} id={form.errorId} />

			<div className="mt-8 flex justify-center">
				<StatusButton
					type="submit"
					size="lg"
					data-value={profileUpdateActionIntent}
					status={fetcher.state !== 'idle' ? 'pending' : form.status ?? 'idle'}
				>
					Save changes
				</StatusButton>
			</div>
		</fetcher.Form>
	)
}

async function signOutOfSessionsAction({ request, userId }: ProfileActionArgs) {
	const authSession = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const sessionId = authSession.get(sessionKey)
	invariantResponse(
		sessionId,
		'You must be authenticated to sign out of other sessions',
	)
	await prisma.session.deleteMany({
		where: {
			userId,
			id: { not: sessionId },
		},
	})
	return json({ status: 'success' } as const)
}

function SignOutOfSessions() {
	const data = useLoaderData<typeof loader>()
	const dc = useDoubleCheck()

	const fetcher = useFetcher<typeof signOutOfSessionsAction>()
	const otherSessionsCount = data.user._count.sessions - 1
	return (
		<div>
			{otherSessionsCount ? (
				<fetcher.Form method="POST">
					<StatusButton
						{...dc.getButtonProps({
							type: 'submit',
							name: 'intent',
							value: signOutOfSessionsActionIntent,
						})}
						intent={dc.doubleCheck ? 'danger' : 'primary'}
						status={
							fetcher.state !== 'idle'
								? 'pending'
								: fetcher.data?.status ?? 'idle'
						}
					>
						<Icon name="avatar">
							{dc.doubleCheck
								? `Are you sure?`
								: `Sign out of ${otherSessionsCount} other sessions`}
						</Icon>
					</StatusButton>
				</fetcher.Form>
			) : (
				<Banner.Root>
					<Banner.Content>
						<Banner.Icon>
							<Icon name="avatar" />
						</Banner.Icon>
						<Text>You are not signed in on any other devices</Text>
					</Banner.Content>
				</Banner.Root>
			)}
		</div>
	)
}

async function deleteDataAction({ userId }: ProfileActionArgs) {
	await prisma.user.delete({ where: { id: userId } })
	return redirectWithToast('/', {
		type: 'success',
		title: 'Data Deleted',
		description: 'All of your data has been deleted',
	})
}

function DeleteData() {
	const dc = useDoubleCheck()

	const fetcher = useFetcher<typeof deleteDataAction>()
	return (
		<div>
			<fetcher.Form method="POST" className="w-full">
				<StatusButton
					{...dc.getButtonProps({
						type: 'submit',
						name: 'intent',
						value: deleteDataActionIntent,
					})}
					className="ml-auto"
					intent={dc.doubleCheck ? 'danger' : 'primary'}
					status={fetcher.state !== 'idle' ? 'pending' : 'idle'}
				>
					<Icon name="trash">
						{dc.doubleCheck ? `Are you sure?` : `Delete all your data`}
					</Icon>
				</StatusButton>
			</fetcher.Form>
		</div>
	)
}
