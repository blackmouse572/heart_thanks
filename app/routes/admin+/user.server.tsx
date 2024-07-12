import { prisma } from '#app/utils/db.server.js'
import { Metadata } from '#app/utils/request.server.js'
import { Prisma } from '@prisma/client'

export function getAllUsers(
	where: Prisma.UserWhereInput,
	metadata: Metadata,
	orderBy: Record<string, any>,
) {
	return prisma.user.findMany({
		where,
		orderBy,
		skip: Number(metadata.skip),
		take: Number(metadata.take),
		select: {
			id: true,
			username: true,
			email: true,
			name: true,
			balance: true,
			vault: true,
			createdAt: true,
			roles: {
				select: {
					name: true,
				},
			},
			image: {
				select: {
					id: true,
				},
			},
		},
	})
}
