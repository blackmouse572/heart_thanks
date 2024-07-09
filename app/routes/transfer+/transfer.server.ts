import { type User } from '@prisma/client'
import { prisma } from '#app/utils/db.server.js'

type TransferHandlerProps = {
	receiver: User
	sender: User
	amount: number
}
/**
 * This function is responsible for handling the transfer of points between two users.
 * It should return the updated user objects after the transfer is complete.
 * It will not handle if the sender does not have enough points to transfer.
 */
export async function transferHandler({
	amount,
	receiver,
	sender,
}: TransferHandlerProps) {
	const [_, __, transaction] = await prisma.$transaction([
		prisma.user.update({
			where: { id: sender.id },
			data: { points: { decrement: amount } },
		}),
		prisma.user.update({
			where: { id: receiver.id },
			data: { points: { increment: amount } },
		}),
		prisma.transactions.create({
			data: {
				title: `Transfer from ${sender.username} to ${receiver.username}`,
				content: '',
				receiver: { connect: { id: receiver.id } },
				amount: amount,
				owner: { connect: { id: sender.id } },
			},
		}),
	])

	return transaction
}
