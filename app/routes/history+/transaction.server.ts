import { type Metadata } from '#app/utils/request.server.ts'
import { prisma } from '#app/utils/db.server.js'
export function getUserTransaction(
	{ take, skip }: Metadata,
	where?: Record<string, any>,
	sort?: Record<string, any>,
) {
	return prisma.transactions.findMany({
		where,
		select: {
			id: true,
			title: true,
			content: true,
			createdAt: true,
			amount: true,
			reviewBy: {
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
			reviewed: true,
			reviewedAt: true,
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
		orderBy: sort,
		skip: Number(skip),
		take: Number(take),
	})
}

export function getUserTransactionCount(
	where?: Record<string, any>,
	sort?: Record<string, any>,
) {
	return prisma.transactions.count({ where, orderBy: sort })
}

export function getMinTransactionAmount(userId?: string) {
	return prisma.transactions.findFirst({
		where: {
			OR: userId
				? [
						{
							ownerId: userId,
						},
						{
							receiverId: userId,
						},
					]
				: undefined,
		},
		orderBy: {
			amount: 'asc',
		},
		select: {
			amount: true,
		},
	})
}

export function getMaxTransactionAmount(userId?: string) {
	return prisma.transactions.findFirst({
		where: {
			OR: userId
				? [
						{
							ownerId: userId,
						},
						{
							receiverId: userId,
						},
					]
				: undefined,
		},
		orderBy: {
			amount: 'desc',
		},

		select: {
			amount: true,
		},
	})
}

export function getTotalsRequireReview(userId?: string) {
	return prisma.transactions.count({
		where: {
			reviewed: false,
			reviewedById: userId,
		},
	})
}
