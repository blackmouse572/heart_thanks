import { Caption } from '#app/components/ui/typography/caption.js'
import Card from '#app/components/ui/card.js'
import { Icon } from '#app/components/ui/icon.js'
import { Skeleton } from '#app/components/ui/skeleton.js'
import { Text } from '#app/components/ui/typography/text.js'
import { Title } from '#app/components/ui/typography/title.js'
import { useCallback } from 'react'

type Data = {
	value: number
	diff?: number
	label: React.ReactNode
}
type StackedCardsProps = {
	data: Data[]
	isLoading?: boolean
}
function getTrend(diff?: number) {
	if (!diff || diff === 0) return 'neutral'
	return diff > 0 ? 'up' : 'down'
}
function StackedCards({ data, isLoading = false }: StackedCardsProps) {
	const renderItem = useCallback(({ label, diff, value }: Data) => {
		const trend = getTrend(diff)
		return (
			<div key={label?.toString()} className="px-4">
				{typeof label === 'string' ? (
					<Caption as="span">{label}</Caption>
				) : (
					label
				)}
				<div className="mt-2 flex items-center justify-between gap-2">
					<Title as="span">{value}</Title>
					{diff && (
						<div
							data-trend={trend}
							className="flex items-center gap-1.5 data-[trend=down]:[--body-text-color:theme(colors.danger.600)] data-[trend=up]:[--body-text-color:theme(colors.success.600)] data-[trend=down]:dark:[--body-text-color:theme(colors.danger.400)] data-[trend=up]:dark:[--body-text-color:theme(colors.success.400)]"
						>
							{trend === 'neutral' ? (
								<Icon
									name="line-dashed"
									className="size-4 text-[--body-text-color]"
								/>
							) : (
								<Icon
									name={`trending-${trend}`}
									className="size-4 text-[--body-text-color]"
								/>
							)}
							<Text size="sm" className="my-0">
								{diff}%
							</Text>
						</div>
					)}
				</div>
			</div>
		)
	}, [])
	return (
		<Card variant="outlined" className="w-full">
			<Title as="h2" size="lg" weight="medium" className="mb-1">
				Overview
			</Title>
			<Text className="my-0" size="sm">
				Visualize your main activities data
			</Text>

			<div className="mt-6 grid gap-4 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
				{isLoading ? (
					<>
						{Array.from({ length: 4 }).map((_, index) => (
							<div key={index} className="px-4">
								<Skeleton className="h-5 w-1/2" />

								<div className="mt-2 flex items-center justify-between gap-3">
									<Skeleton className="h-8 w-1/4" />
									<div className="flex items-center gap-1.5">
										<Skeleton className="h-5 w-5 rounded-full" />
										<Skeleton className="h-5 w-[80px]" />
									</div>
								</div>
							</div>
						))}
					</>
				) : (
					data.map((item, index) => renderItem(item))
				)}
			</div>
		</Card>
	)
}

export default StackedCards
