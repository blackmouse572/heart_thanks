import { type MetaFunction } from '@remix-run/node'

import { cn, getUserImgSrc } from '#app/utils/misc.tsx'
import { logos } from './logos/logos.ts'

export const meta: MetaFunction = () => [{ title: 'Heart Thanks' }]

// Tailwind Grid cell classes lookup
const columnClasses: Record<(typeof logos)[number]['column'], string> = {
	1: 'xl:col-start-1',
	2: 'xl:col-start-2',
	3: 'xl:col-start-3',
	4: 'xl:col-start-4',
	5: 'xl:col-start-5',
}
const rowClasses: Record<(typeof logos)[number]['row'], string> = {
	1: 'xl:row-start-1',
	2: 'xl:row-start-2',
	3: 'xl:row-start-3',
	4: 'xl:row-start-4',
	5: 'xl:row-start-5',
	6: 'xl:row-start-6',
}

import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.js'
import { useLoaderData } from '@remix-run/react'
import { Title } from '#app/components/ui/typography/title.js'
import { Display } from '#app/components/ui/typography/display.js'
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'
import { area, cartesianGrid } from '@tailus/themer'
import Custom from '#app/components/ui/visualizations/Tooltip.js'

export async function loader({ request }: LoaderFunctionArgs) {
	const topUser = await prisma.user.findMany({
		take: 3,
		orderBy: {
			vault: 'desc',
		},
		include: {
			image: {
				select: {
					id: true,
				},
			},
		},
	})
	return json({ user: topUser })
}

export default function Index() {
	const { user } = useLoaderData<typeof loader>()
	return (
		<main className="font-poppins grid h-full place-items-center">
			<div className="grid place-items-center px-4 py-16 xl:grid-cols-2 xl:gap-24">
				<div className="flex max-w-md flex-col items-center text-center xl:order-2 xl:items-start xl:text-left">
					<a
						href="https://www.epicweb.dev/stack"
						className="animate-slide-top xl:animate-slide-left [animation-fill-mode:backwards] xl:[animation-delay:0.5s] xl:[animation-fill-mode:backwards]"
					>
						<svg
							className="text-foreground size-20 xl:-mt-4"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 65 65"
						>
							<path
								fill="currentColor"
								d="M39.445 25.555 37 17.163 65 0 47.821 28l-8.376-2.445Zm-13.89 0L28 17.163 0 0l17.179 28 8.376-2.445Zm13.89 13.89L37 47.837 65 65 47.821 37l-8.376 2.445Zm-13.89 0L28 47.837 0 65l17.179-28 8.376 2.445Z"
							></path>
						</svg>
					</a>
					<h1
						data-heading
						className="animate-slide-top text-foreground xl:animate-slide-left mt-8 text-4xl font-medium [animation-delay:0.3s] [animation-fill-mode:backwards] md:text-5xl xl:mt-4 xl:text-6xl xl:[animation-delay:0.8s] xl:[animation-fill-mode:backwards]"
					>
						HEART THANKS
					</h1>
				</div>
				<ul className="mt-16 space-y-5">
					<div className="h-56 w-full sm:h-80 sm:min-w-[36rem] sm:max-w-2xl">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={user.map((u) => ({
									name: u.name,
									user: u,
									point: u.vault,
								}))}
							>
								<YAxis
									className="text-[--caption-text-color]"
									fontSize={12}
									tickLine={false}
									axisLine={false}
								/>
								<XAxis
									className="text-[--caption-text-color]"
									dataKey="name"
									fontSize={12}
									tickLine={false}
									axisLine={false}
									tick={({ x, y, payload }) => (
										<svg x={x - 15} y={y - 5}>
											<image
												width={35}
												height={35}
												className="rounded-full"
												xlinkHref={getUserImgSrc(
													user[payload.index]?.image?.id,
												)}
											/>
										</svg>
									)}
								/>
								<CartesianGrid
									className={cartesianGrid()}
									vertical={false}
									stroke="currentColor"
									strokeDasharray={3}
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
									className={area({ gradient: true, intent: 'secondary' })}
									radius={[8, 8, 8, 8]}
									fill="currentColor"
									dataKey="point"
									label={({ value, x, y, width, height }) => (
										<text
											x={x + width / 2}
											y={y + height / 2}
											fill="white"
											textAnchor="middle"
											dy={-6}
										>
											{value}💖
										</text>
									)}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</ul>
			</div>
		</main>
	)
}
