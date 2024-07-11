import { prisma } from '#app/utils/db.server.js'
import { requireUserWithRole } from '#app/utils/permissions.server.js'
import { ActionFunctionArgs } from '@remix-run/node'
import { Await, defer, NavLink, useLoaderData } from '@remix-run/react'
import React from 'react'
import StackedCards from './StackCard'
import MostPointUserChart from './MostPointsUserChart'
import RecentTransactions from './RecentTransactions'
import { Icon } from '#app/components/ui/icon.js'
import { Text } from '#app/components/ui/typography/text.js'
import Card from '#app/components/ui/card.js'
import { Title } from '#app/components/ui/typography/title.js'
import * as Link from '#app/components/ui/link.js'
import { Caption } from '#app/components/ui/typography/caption.js'
export async function loader({ request }: ActionFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
	yesterday.setHours(0, 0, 0, 0)
	const today = new Date(new Date().setHours(0, 0, 0, 0))
	const endToday = new Date(new Date().setHours(23, 59, 59, 999))
	const totalTransferTodayPromise = prisma.transactions
		.count({
			where: {
				createdAt: {
					gte: new Date(new Date().setHours(0, 0, 0, 0)),
					lte: new Date(new Date().setHours(23, 59, 59, 999)),
				},
			},
		})
		// count all transactions that happened yesterday
		.then(async (value) => {
			return prisma.transactions
				.count({
					where: {
						createdAt: {
							gte: yesterday,
							lte: today,
						},
					},
				})
				.then((diff) => ({
					value,
					diff,
				}))
		})

	const totalHeartTransfered = prisma.transactions
		.aggregate({
			_sum: {
				amount: true,
			},
			where: {
				createdAt: {
					gte: today,
					lte: endToday,
				},
			},
		})
		.then((value) =>
			prisma.transactions
				.aggregate({
					_sum: {
						amount: true,
					},
					where: {
						createdAt: {
							gte: yesterday,
							lte: today,
						},
					},
				})
				.then((diff) => ({
					value: value._sum.amount ?? 0,
					diff: diff._sum.amount ?? 0,
				})),
		)

	const totalUsers = prisma.user.count().then((currentUser) =>
		prisma.user
			.count({ where: { createdAt: { lt: today } } })
			.then((totalUser) => ({
				value: currentUser,
				diff: currentUser - totalUser,
			})),
	)
	// average points of all users
	const averagePoints = prisma.user
		.aggregate({
			_avg: {
				points: true,
			},
		})
		.then((value) => value._avg.points ?? 0)

	const mostPointsUser = prisma.user
		.findMany({
			take: 5,
			orderBy: {
				points: 'desc',
			},
		})
		.then((user) => user)

	const recentTransactions = prisma.transactions
		.findMany({
			take: 5,
			orderBy: {
				createdAt: 'desc',
			},
			include: {
				owner: {
					select: {
						username: true,
						name: true,
						image: {
							select: {
								id: true,
							},
						},
					},
				},
				receiver: {
					select: {
						username: true,
						name: true,
						image: {
							select: {
								id: true,
							},
						},
					},
				},
			},
		})
		.then((transactions) => transactions)

	return defer({
		totalTransferToday: totalTransferTodayPromise,
		totalHeartTransfered,
		totalUsers,
		averagePoints,
		mostPointsUser,
		recentTransactions,
	})
}

function getPercentageDiff(a: number, b: number) {
	if (b === 0) return 100
	if (a === 0) return 0
	return (a / b) * 100
}
function AdminPage() {
	const {
		totalHeartTransfered,
		totalTransferToday,
		totalUsers,
		averagePoints,
		mostPointsUser,
		recentTransactions,
	} = useLoaderData<typeof loader>()
	return (
		<div className="container mt-5 space-y-4">
			<React.Suspense fallback={<StackedCards isLoading data={[]} />}>
				<Await
					resolve={Promise.all([
						totalHeartTransfered,
						totalTransferToday,
						totalUsers,
						averagePoints,
					])}
				>
					{([
						totalHeartTransfered,
						totalTransferToday,
						totalUsers,
						averagePoints,
					]) => {
						const data = [
							{
								value: totalTransferToday.value,
								diff: getPercentageDiff(
									totalTransferToday.value,
									totalTransferToday.diff,
								),
								label: 'Transfer Count Today 🔄️',
							},
							{
								value: totalHeartTransfered.value,
								diff: getPercentageDiff(
									totalHeartTransfered.value,
									totalHeartTransfered.diff,
								),
								label: 'Total Heart Transfered Today 💖',
							},
							{
								value: totalUsers.value,
								diff: getPercentageDiff(totalUsers.value, totalUsers.diff),
								label: 'Total Users 🧑‍🤝‍🧑',
							},
							{
								value: averagePoints,
								label: 'Average Points per User 📊',
							},
						]
						return <StackedCards data={data} />
					}}
				</Await>
			</React.Suspense>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="flex flex-col gap-4">
					<Card variant="outlined">
						<Title>Quick access</Title>
						<Caption>
							You can change this on{' '}
							<NavLink to="/admin/settings">setting</NavLink>
						</Caption>
						<div className="mt-5 grid grid-cols-2">
							<Link.Root link="/admin/users" intent="primary">
								<Link.Icon>
									<Icon name="avatar" />
								</Link.Icon>
								<Link.Label>
									<Text>User Manager</Text>
								</Link.Label>
							</Link.Root>
							<Link.Root link="/admin/transactions" intent="secondary">
								<Link.Icon>
									<Icon name="transfer" />
								</Link.Icon>
								<Link.Label>
									<Text>Transactions History</Text>
								</Link.Label>
							</Link.Root>
							<Link.Root link="/admin/settings" intent="danger">
								<Link.Icon>
									<Icon name="chevron-up-right" />
								</Link.Icon>
								<Link.Label>
									<Text>Application Settings</Text>
								</Link.Label>
							</Link.Root>
						</div>
					</Card>
					<Card variant="outlined" className="flex-1">
						<React.Suspense
							fallback={<MostPointUserChart isLoading mostPointsUser={[]} />}
						>
							<Await resolve={Promise.all([mostPointsUser])}>
								{([mostPointsUser]) => {
									return (
										<MostPointUserChart
											mostPointsUser={mostPointsUser as any}
										/>
									)
								}}
							</Await>
						</React.Suspense>
					</Card>
				</div>
				<React.Suspense
					fallback={<MostPointUserChart isLoading mostPointsUser={[]} />}
				>
					<Await resolve={Promise.all([recentTransactions])}>
						{([a]) => {
							return <RecentTransactions data={a as any} />
						}}
					</Await>
				</React.Suspense>
			</div>
		</div>
	)
}
export default AdminPage
