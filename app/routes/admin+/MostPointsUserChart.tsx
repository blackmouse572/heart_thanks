import { Caption } from '#app/components/ui/caption.js'
import Card from '#app/components/ui/card.js'
import { Title } from '#app/components/ui/title.js'
import Custom from '#app/components/ui/visualizations/Tooltip.js'
import { cartesianGrid, area } from '@tailus/themer'
import {
	ResponsiveContainer,
	BarChart,
	CartesianGrid,
	YAxis,
	XAxis,
	Tooltip,
	Bar,
	LabelList,
} from 'recharts'
import { AspectRatio } from '@radix-ui/react-aspect-ratio'
import { Skeleton } from '#app/components/ui/skeleton.js'
type MostPointsUser = {
	name: string
	points: number
}[]

type MostPointsUserChartProps = {
	mostPointsUser: MostPointsUser
	isLoading?: boolean
}
function MostPointUserChart({
	mostPointsUser,
	isLoading = false,
}: MostPointsUserChartProps) {
	return (
		<Card variant="outlined">
			<div>
				<Title as="h2" size="lg" weight="medium" className="mb-1">
					Most Points User
				</Title>
				<Caption className="mb-0 mt-1">Most points user in the system</Caption>
			</div>
			<AspectRatio data-shade="900" ratio={16 / 9}>
				{isLoading ? (
					<div className="my-4 space-y-4">
						<Skeleton className="h-8 w-2/3" />
						<Skeleton className="h-8 w-1/2" />
						<Skeleton className="h-8 w-3/5" />
						<Skeleton className="h-8 w-3/4" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-3/5" />
						<Skeleton className="h-8 w-1/2" />
					</div>
				) : (
					<ResponsiveContainer width="100%" minHeight={300}>
						<BarChart layout="vertical" data={mostPointsUser}>
							<CartesianGrid
								className={cartesianGrid()}
								vertical={false}
								stroke="currentColor"
								strokeDasharray={3}
							/>

							<YAxis
								className="text-[--caption-text-color]"
								fontSize={12}
								axisLine={false}
								type="category"
								scale="band"
								dataKey="name"
								hide
							/>
							<XAxis
								className="text-[--caption-text-color]"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								hide
								type="number"
							/>
							<Tooltip
								cursor={{
									fill: 'transparent',
								}}
								content={
									<Custom color="red" payload={[]} active label={'User'} />
								}
							/>
							<Bar
								className={area({
									gradient: true,
									intent: 'primary',
								})}
								radius={8}
								fill="currentColor"
								dataKey={'points'}
							>
								<LabelList
									className="text-white"
									fontSize={12}
									position="insideLeft"
									fill="currentColor"
									stroke="none"
									dataKey="name"
								/>
								<LabelList
									className="text-[--body-text-color]"
									fontSize={12}
									position="right"
									fill="currentColor"
									stroke="none"
									dataKey="points"
								/>
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				)}
			</AspectRatio>
		</Card>
	)
}

export default MostPointUserChart
