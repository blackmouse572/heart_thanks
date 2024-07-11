import { prisma } from '#app/utils/db.server.js'
import { type User } from '@prisma/client'
import { json } from '@remix-run/react'

type CommonTransferHandlerProps = {
	receiver: User
	sender: User
	reviewer: User
	amount: number
}
function validationHandler({
	amount,
	receiver,
	sender,
}: CommonTransferHandlerProps) {
	if (amount <= 0) {
		throw new Error('Invalid amount')
	}

	if (sender.balance < amount) {
		throw new Error('Insufficient balance')
	}

	if (sender.id === receiver.id) {
		throw new Error('Cannot transfer to the same user')
	}

	return true
}
type TransferHandlerProps = CommonTransferHandlerProps & {
	title: string
	description?: string
}
/**
 * This function create a transaction on pending state, it will need to be reviewed by a reviewer to make changes of the balance
 */
export async function transferHandler({
	amount,
	receiver,
	reviewer,
	sender,
	title,
	description,
}: TransferHandlerProps) {
	const isValid = validationHandler({ amount, receiver, sender, reviewer })

	if (isValid) {
		const transaction = await prisma.transactions.create({
			data: {
				title,
				content: description ?? '',
				receiver: { connect: { id: receiver.id } },
				amount,
				owner: { connect: { id: sender.id } },
				reviewed: false,
				reviewBy: { connect: { id: reviewer.id } },
			},
		})

		return transaction
	}
	throw new Error('Invalid transfer')
}

type ConfirmTransferHandlerProps = {
	currentUser: User
	transactionId: string
	options?: {
		changeToCurentUser: boolean
	}
}
export async function confirmTransferHandler({
	currentUser,
	transactionId,
	options,
}: ConfirmTransferHandlerProps) {
	const transaction = await prisma.transactions.findUnique({
		where: { id: transactionId },
		include: { owner: true, receiver: true, reviewBy: true },
	})

	if (!transaction) {
		return json(
			{
				error: 'Not found',
				message: `Transaction not found`,
			},
			{ status: 404 },
		)
	}

	const { owner, receiver, reviewBy, amount } = transaction

	// This already checked on action handler
	// if (currentUser.id !== reviewBy?.id) {
	// 	return json(
	// 		{
	// 			error: 'Unauthorized',
	// 			message: `You are not authorized to review this transaction`
	// 		},
	// 		{ status: 401 },
	// 	)
	// }

	const [_, __, transactionUpdated] = await prisma.$transaction([
		prisma.user.update({
			where: { id: owner.id },
			data: { balance: { decrement: amount } },
		}),
		prisma.user.update({
			where: { id: receiver.id },
			data: { vault: { increment: amount } },
		}),
		prisma.transactions.update({
			where: { id: transactionId },
			data: {
				receiver: { connect: { id: receiver.id } },
				owner: { connect: { id: owner.id } },
				amount,
				reviewed: true,
				reviewedAt: new Date(),
				reviewBy: options?.changeToCurentUser
					? { connect: { id: currentUser.id } }
					: undefined,
			},
		}),
	])

	return transactionUpdated
}
