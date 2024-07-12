import { User } from '@prisma/client'
import HoverCard from './hover-card'
import UserAvatar from '../user-avatar'
import { Link } from './typography/link'
import React from 'react'

export type UserCardProps = {
	user: User & { image?: { id: string } }
} & (
	| {
			trigger: React.ReactNode
			linkProps?: never
	  }
	| {
			trigger?: never
			linkProps?: Omit<React.ComponentProps<typeof Link>, 'children'>
	  }
)
function UserCard(props: UserCardProps) {
	const { user, linkProps } = props
	console.log({ user })
	return (
		<HoverCard.Root>
			<HoverCard.Trigger>
				<Link
					className="text-nowrap"
					href={`/users/${user?.username}`}
					{...linkProps}
				>
					{user?.name || user?.username}
				</Link>
			</HoverCard.Trigger>
			<HoverCard.Content fancy className="max-w-[250px]">
				<UserAvatar
					imageId={user?.image?.id}
					title={user?.name || user?.username}
					description={user?.username}
				/>
			</HoverCard.Content>
		</HoverCard.Root>
		// <HoverCard.Root>
		// 	<HoverCard.Trigger asChild>
		// 		<Link>{user.name ?? user.username}</Link>
		// 	</HoverCard.Trigger>
		// 	<HoverCard.Content fancy className="max-w-[250px]">
		// 		<UserAvatar
		// 			title={user.name ?? user.username}
		// 			description={user.username}
		// 			imageId={user.image?.id}
		// 		/>
		// 	</HoverCard.Content>
		// </HoverCard.Root>
	)
}

export default UserCard
