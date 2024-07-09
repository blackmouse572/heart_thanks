import { cn } from '#app/utils/misc.js'

function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn('animate-pulse rounded-md bg-primary-500/10', className)}
			{...props}
		/>
	)
}

export { Skeleton }
