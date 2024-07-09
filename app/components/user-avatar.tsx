import { getUserImgSrc } from '#app/utils/misc.js'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Caption } from './ui/caption'
import { Text } from './ui/text'

type UserAvatarProps = {
	imageId?: string
	size?: number
	title?: string
	description?: string
}
function UserAvatar({ imageId, size, title, description }: UserAvatarProps) {
	return (
		<div className="flex items-center gap-2">
			<Avatar>
				<AvatarImage src={getUserImgSrc(imageId)} alt={title} />
				<AvatarFallback>{title}</AvatarFallback>
			</Avatar>
			<div>
				<Text>{title}</Text>
				<Caption>{description}</Caption>
			</div>
		</div>
	)
}

export default UserAvatar
