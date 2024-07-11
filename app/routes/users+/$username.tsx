import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'

import Button from '#app/components/ui/button.js'
import Card from '#app/components/ui/card.js'
import UserAvatar from '#app/components/user-avatar.js'
import { prisma } from '#app/utils/db.server.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { useOptionalUser } from '#app/utils/user.ts'
import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, useLoaderData, type MetaFunction } from '@remix-run/react'

export async function loader({ params }: LoaderFunctionArgs) {
	const user = await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			username: true,
			createdAt: true,
			image: { select: { id: true } },
		},
		where: {
			username: params.username,
		},
	})

	invariantResponse(user, 'User not found', { status: 404 })

	return json({ user, userJoinedDisplay: user.createdAt.toLocaleDateString() })
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
				<div className="relative">
					<UserAvatar
						title={userDisplayName}
						description={user.username}
						imageId={user.image?.id}
						size="2xl"
					/>
				</div>

				<Spacer size="sm" />

				<div className="flex flex-col items-center">
					<div className="flex flex-wrap items-center justify-center gap-4">
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
