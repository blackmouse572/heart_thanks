import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'

import Button from '#app/components/ui/button.js'
import Card from '#app/components/ui/card.js'
import { Icon } from '#app/components/ui/icon.js'
import { List } from '#app/components/ui/typography/list.js'
import UserAvatar from '#app/components/user-avatar.js'
import { prisma } from '#app/utils/db.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'
import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { type ActionFunctionArgs } from '@remix-run/node'
import { redirectWithToast } from '#app/utils/toast.server.js'
import { Form, Link, useLoaderData, type MetaFunction } from '@remix-run/react'

export async function loader({ params }: LoaderFunctionArgs) {
	const user = await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			username: true,
			createdAt: true,
			balance: true,
			vault: true,
			roles: true,
			image: { select: { id: true } },
		},
		where: {
			username: params.username,
		},
	})

	invariantResponse(user, 'User not found', { status: 404 })

	return json({ user, userJoinedDisplay: user.createdAt.toLocaleDateString() })
}

export async function action({ request, params }: ActionFunctionArgs) {
	const formData = await request.formData()
	const user = JSON.parse(formData.get('user') as string) as any
	return redirectWithToast(`/users/${params.username}`, {
		description: `You have poke ${user.name ?? user.username}!`,
		title: `Poked ${user.name}`,
	})
}

export default function ProfileRoute() {
	const data = useLoaderData<typeof loader>()
	const user = data.user
	const userDisplayName = user.name ?? user.username
	const loggedInUser = useOptionalUser()
	const isLoggedInUser = data.user.id === loggedInUser?.id

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center">
			<Spacer size="4xs" />

			<Card className="container flex-col items-center rounded-3xl p-12">
				<div className="item-start relative flex justify-between">
					<UserAvatar
						title={userDisplayName}
						description={user.username}
						imageId={user.image?.id}
						size="2xl"
					/>
					<Form method="POST">
						<input hidden name="user" value={JSON.stringify(user)} />
						<Button.Root type="submit" variant="outlined">
							<Button.Label>Poke</Button.Label>
							<Button.Icon type="trailing">
								<Icon name="hand-finger-right" />
							</Button.Icon>
						</Button.Root>
					</Form>
				</div>

				<Spacer size="sm" />
				<List type="none" inside>
					<li>
						<b>Username:</b> {user.username}
					</li>
					<li>
						<b>Balance:</b> {user.balance} 💖
					</li>
					<li>
						<b>Vault:</b> {user.vault} 💖
					</li>
				</List>

				<div className="flex flex-col items-center justify-start">
					<div className="flex flex-wrap items-center justify-start gap-4">
						<h1 className="text-h2 text-center">{userDisplayName}</h1>
					</div>
					<p className="text-muted-foreground mt-2 text-center">
						Joined {data.userJoinedDisplay}
					</p>
					{isLoggedInUser ? (
						<Form action="/logout" method="POST" className="mt-3">
							<Button.Root type="submit" variant="ghost" size="md">
								<Button.Label>Logout</Button.Label>
							</Button.Root>
						</Form>
					) : null}
					<div className="mt-10 flex gap-4">
						{isLoggedInUser ? (
							<>
								<Button.Root>
									<Link to="notes" prefetch="intent">
										My notes
									</Link>
								</Button.Root>
								<Button.Root>
									<Link to="/settings/profile" prefetch="intent">
										Edit profile
									</Link>
								</Button.Root>
							</>
						) : (
							<Link
								to={`/transfer?transfer-form-recipientId=${user.username}`}
								prefetch="intent"
							>
								<Button.Root>
									<Button.Label>Send 💖 {userDisplayName}</Button.Label>
								</Button.Root>
							</Link>
						)}
					</div>
				</div>
			</Card>
		</div>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	const displayName = data?.user.name ?? params.username
	return [
		{ title: `${displayName} | Epic Notes` },
		{
			name: 'description',
			content: `Profile of ${displayName} on Epic Notes`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No user with the username "{params.username}" exists</p>
				),
			}}
		/>
	)
}
