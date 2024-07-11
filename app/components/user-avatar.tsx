import { getUserImgSrc } from '#app/utils/misc.js'
import { AvatarRootProps } from '@tailus/themer'
import Avatar from './ui/avatar.js'
import { Caption } from './ui/typography/caption.js'
import { Text } from './ui/typography/text.js'
import { Link } from '@remix-run/react'

type UserAvatarProps = {
	imageId?: string
	title?: string
	description?: string
	rtl?: boolean
	href?: string
} & AvatarRootProps
function UserAvatar({
	imageId,
	href,
	size,
	title,
	description,
	rtl,
	...props
}: UserAvatarProps) {
	const Container = href ? Link : 'div'
	return (
		<Container to={href ?? ''} className="flex items-center gap-2">
			{rtl && title && (
				<div>
					<Text
						weight={'medium'}
						size={size === '2xl' ? 'lg' : size === 'xl' ? 'base' : 'sm'}
					>
						{title}
					</Text>
					<Caption size="xs">{description}</Caption>
				</div>
			)}
			<Avatar.Root size={size} {...props}>
				<Avatar.Image src={getUserImgSrc(imageId)} alt={title} />
				<Avatar.Fallback>{title}</Avatar.Fallback>
			</Avatar.Root>
			{!rtl && title && (
				<div>
					<Text
						weight={'medium'}
						size={size === '2xl' ? 'lg' : size === 'xl' ? 'base' : 'sm'}
					>
						{title}
					</Text>
					<Caption>{description}</Caption>
				</div>
			)}
		</Container>
	)
}

export default UserAvatar
