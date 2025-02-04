import Checkbox from '#app/components/checkbox.js'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import Tooltip from '#app/components/tooltip.js'
import Aligner from '#app/components/ui/aligner.js'
import Badge from '#app/components/ui/badge.js'
import Banner from '#app/components/ui/banner.js'
import Button from '#app/components/ui/button.tsx'
import Card from '#app/components/ui/card.js'
import HoverCard from '#app/components/ui/hover-card.js'
import { Icon } from '#app/components/ui/icon.tsx'
import SeparatorRoot from '#app/components/ui/seperator.js'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { Caption } from '#app/components/ui/typography/caption.js'
import { Code } from '#app/components/ui/typography/code.js'
import Label from '#app/components/ui/typography/label.js'
import { Link as Links } from '#app/components/ui/typography/link'
import { List } from '#app/components/ui/typography/list.js'
import { Text } from '#app/components/ui/typography/text.js'
import { Title } from '#app/components/ui/typography/title.js'
import UserCard from '#app/components/ui/user-hover-card.js'
import UserAvatar from '#app/components/user-avatar.js'
import {
	cancelTransferHandler,
	confirmTransferHandler,
} from '#app/routes/transfer+/transfer.server.js'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useCopyToClipboard } from '#app/utils/hooks/useCopy.js'
import { useDoubleCheck, useIsPending } from '#app/utils/misc.tsx'
import {
	requireUserWithPermission,
	requireUserWithRole,
} from '#app/utils/permissions.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { userHasRole, useUser } from '#app/utils/user.ts'
import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import {
	Form,
	useActionData,
	useLoaderData,
	type MetaFunction,
} from '@remix-run/react'
import { MouseButtonFlip } from '@testing-library/user-event/dist/cjs/system/pointer/buttons.js'
import { formatDistanceToNow } from 'date-fns'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import CancelHistoryAlertDialog from './CancelHistory'
import {
	ENUM_TRANSACTION_STATUS,
	transactionStatusToIntent,
} from '#app/utils/transaction.js'

export async function loader({ params }: LoaderFunctionArgs) {
	const select = {
		id: true,
		name: true,
		username: true,
		email: true,
		image: {
			select: {
				altText: true,
				id: true,
			},
		},
	}
	const transactions = await prisma.transactions.findUnique({
		where: { id: params.historyId },
		include: {
			owner: {
				select,
			},
			receiver: {
				select,
			},
			reviewBy: {
				select,
			},
		},
	})

	invariantResponse(transactions, 'Not found', { status: 404 })

	const date = new Date(transactions.updatedAt)
	const timeAgo = formatDistanceToNow(date)

	return json({
		note: transactions,
		timeAgo,
	})
}

export const ENUM_HISTORY_FORM_INTENT = {
	MARK_AS_REVIEWED: 'MARK_AS_REVIEWED',
	ADMIN_MARK_AS_REVIEWED: 'ADMIN_MARK_AS_REVIEWED',
	MARK_AS_CANCELLED: 'MARK_AS_CANCELLED',
}
const AdminMarkAsReviewedSchema = z.object({
	intent: z.enum([
		ENUM_HISTORY_FORM_INTENT.MARK_AS_REVIEWED,
		ENUM_HISTORY_FORM_INTENT.ADMIN_MARK_AS_REVIEWED,
		ENUM_HISTORY_FORM_INTENT.MARK_AS_CANCELLED,
	]),
	transactionId: z.string(),
	changeToAdmin: z.boolean().default(false), // this will change reviewBy to admin (currentUser)
})

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent') as string
	if (intent === ENUM_HISTORY_FORM_INTENT.ADMIN_MARK_AS_REVIEWED) {
		const submission = parseWithZod(formData, {
			schema: AdminMarkAsReviewedSchema,
		})
		if (submission.status !== 'success') {
			return json(
				{ result: submission.reply() },
				{ status: submission.status === 'error' ? 400 : 200 },
			)
		}

		const { transactionId: noteId } = submission.value

		const note = await prisma.transactions.findFirst({
			select: {
				id: true,
				ownerId: true,
				owner: { select: { username: true } },
				reviewBy: { select: { id: true, username: true } },
			},
			where: { id: noteId },
		})
		invariantResponse(note, 'Not found', { status: 404 })

		const currentUser = await prisma.user.findUnique({
			where: { id: userId },
		})

		invariantResponse(currentUser, 'Unauthorized', { status: 403 })

		await requireUserWithRole(request, 'admin')

		await confirmTransferHandler({
			currentUser,
			transactionId: noteId,
		})

		return redirectWithToast(`/history/${note.id}`, {
			type: 'success',
			title: 'Success',
			description: 'Transaction has been reviewed',
		})
	} else if (intent === ENUM_HISTORY_FORM_INTENT.MARK_AS_REVIEWED) {
		const submission = parseWithZod(formData, {
			schema: AdminMarkAsReviewedSchema,
		})
		if (submission.status !== 'success') {
			return json(
				{ result: submission.reply() },
				{ status: submission.status === 'error' ? 400 : 200 },
			)
		}

		const { transactionId: noteId } = submission.value

		const note = await prisma.transactions.findFirst({
			select: {
				id: true,
				ownerId: true,
				owner: { select: { username: true } },
				reviewBy: { select: { id: true, username: true } },
			},
			where: { id: noteId },
		})
		invariantResponse(note, 'Not found', { status: 404 })

		const isOwner = note.reviewBy?.id === userId
		const currentUser = await prisma.user.findUnique({
			where: { id: userId },
		})

		invariantResponse(currentUser, 'Unauthorized', { status: 403 })

		await requireUserWithPermission(
			request,
			isOwner ? `update:transaction:own` : `update:transaction:any`,
		)

		await confirmTransferHandler({
			currentUser,
			transactionId: noteId,
		})

		return redirectWithToast(`/history/${note.id}`, {
			type: 'success',
			title: 'Success',
			description: 'Transaction has been reviewed',
		})
	} else if (intent === ENUM_HISTORY_FORM_INTENT.MARK_AS_CANCELLED) {
		const submission = parseWithZod(formData, {
			schema: AdminMarkAsReviewedSchema,
		})
		if (submission.status !== 'success') {
			return json(
				{ result: submission.reply() },
				{ status: submission.status === 'error' ? 400 : 200 },
			)
		}

		const { transactionId: noteId } = submission.value

		const note = await prisma.transactions.findFirst({
			select: {
				id: true,
				ownerId: true,
				owner: { select: { username: true } },
				reviewBy: { select: { id: true, username: true } },
			},
			where: { id: noteId },
		})
		invariantResponse(note, 'Not found', { status: 404 })

		const isOwner = note.reviewBy?.id === userId
		const currentUser = await prisma.user.findUnique({
			where: { id: userId },
		})

		invariantResponse(currentUser, 'Unauthorized', { status: 403 })

		await requireUserWithPermission(
			request,
			isOwner ? `update:transaction:own` : `update:transaction:any`,
		)

		await cancelTransferHandler({
			currentUser,
			transactionId: noteId,
		})

		return redirectWithToast(`/history/${note.id}`, {
			type: 'error',
			title: 'Success',
			description: 'Transaction has been canned',
		})
	}

	return json(
		{
			status: 'error',
			message: 'Invalid intent',
		},
		{
			status: 400,
		},
	)
}

export default function NoteRoute() {
	const data = useLoaderData<typeof loader>()
	const { note } = data
	const user = useUser()
	const isOwner = user?.id === data.note.ownerId
	const canReview = user?.id === data.note.reviewBy?.id && !data.note.reviewed
	const isAdmin = userHasRole(user as any, 'admin')
	const [isCopied, setIsCopied] = useState(false)
	const [_, copy] = useCopyToClipboard()

	const copyId = useCallback(() => {
		if (isCopied) {
			return
		}
		copy(data.note.id)
		setIsCopied(true)

		setTimeout(() => {
			setIsCopied(false)
		}, 3000)

		toast.success('Copied to clipboard')
	}, [])

	const renderReviewSection = useMemo(() => {
		if (note.status === ENUM_TRANSACTION_STATUS.FAILED) {
			return (
				<Banner.Root intent="danger">
					<Banner.Content>
						<Banner.Icon>
							<Icon name="x" className="size-5 text-[--body-text-color]" />
						</Banner.Icon>
						<div className="space-y-2">
							<Title>Transaction canceled</Title>
							<Text>
								This transaction has been canceled by{' '}
								<UserCard
									user={note.reviewBy as any}
									linkProps={{
										intent: 'danger',
										variant: 'underlined',
										href: `/users/${note.reviewBy?.username}`,
									}}
								/>{' '}
								{formatDistanceToNow(new Date(note.reviewedAt!), {
									includeSeconds: true,
									addSuffix: true,
								})}
							</Text>
						</div>
					</Banner.Content>
				</Banner.Root>
			)
		} else if (note.reviewed)
			return (
				<Banner.Root intent="success">
					<Banner.Content>
						<Banner.Icon>
							<Icon
								name="circle-dashed-check"
								className="size-5 text-[--body-text-color]"
							/>
						</Banner.Icon>
						<div className="space-y-2">
							<Title>Transaction reviewed</Title>
							<Text>
								This transaction has been reviewed by{' '}
								<UserCard
									user={note.reviewBy as any}
									linkProps={{
										intent: 'success',
										variant: 'underlined',
										href: `/users/${note.reviewBy?.username}`,
									}}
								/>{' '}
								{formatDistanceToNow(new Date(note.reviewedAt!), {
									includeSeconds: true,
									addSuffix: true,
								})}
							</Text>
						</div>
					</Banner.Content>
				</Banner.Root>
			)
		if (isOwner || !canReview) return
		return (
			<Card variant="outlined">
				<Title>Review this transaction</Title>
				<Caption>
					This transaction required your review, please confirm the information
					and mark as reviewed
				</Caption>
				<List as="ol" type="none" inside className="mt-4 space-y-3">
					<li>
						<Icon
							name="circle-dashed-check"
							className="mr-2 text-success-500"
							size="lg"
						/>
						<b>Amount </b> is correct
					</li>
					<li>
						<Icon
							name="circle-dashed-check"
							className="mr-2 text-success-500"
							size="lg"
						/>
						<b>Owner</b> is correct
					</li>
					<li>
						<Icon
							name="circle-dashed-check"
							className="mr-2 text-success-500"
							size="lg"
						/>
						<b>Receiver</b> is correct
					</li>
					<li>
						<Icon
							name="circle-dashed-check"
							className="mr-2 text-success-500"
							size="lg"
						/>
						<b>Reason</b> is correct
					</li>
				</List>
				<SeparatorRoot className="my-4" />
				<MarkAsReviewed noteId={note.id} />
			</Card>
		)
	}, [canReview, isOwner, note.id, note.reviewBy?.username, note.reviewed])

	return (
		<div className="container mt-5">
			<div className="grid place-items-start gap-4 lg:grid-cols-4">
				<div className="col-span-full row-span-1 flex w-full flex-col gap-4 lg:col-span-3">
					<Card variant="outlined" className="w-full cursor-default">
						<div className="flex justify-between">
							<Text size={'sm'} className="flex items-center gap-2">
								# {note.id}
							</Text>
							<div className="flex gap-1">
								<Tooltip content="Copy ID">
									<Button.Root
										intent={isCopied ? 'success' : 'gray'}
										variant="ghost"
										onClick={copyId}
										size="xs"
									>
										<Button.Icon type="only">
											<Icon name={isCopied ? 'clipboard-check' : 'clipboard'} />
										</Button.Icon>
									</Button.Root>
								</Tooltip>
								{note.reviewed === false &&
									note.status !== ENUM_TRANSACTION_STATUS.FAILED && (
										<>
											<Tooltip content="Edit">
												<Button.Root intent={'gray'} variant="ghost" size="xs">
													<Button.Icon type="only">
														<Icon name={'pencil-2'} />
													</Button.Icon>
												</Button.Root>
											</Tooltip>
											<CancelHistoryAlertDialog id={note.id} />
										</>
									)}
							</div>
						</div>
						<Title>{note.title}</Title>
						<SeparatorRoot className="my-2" />
						{note.content ? (
							<Caption>{note.content}</Caption>
						) : (
							<Caption>This transaction doest no have description</Caption>
						)}
					</Card>
					{renderReviewSection}
				</div>
				<Card
					variant="outlined"
					className="col-span-full row-span-2 w-full lg:col-span-1"
				>
					<Title>Details</Title>
					<Caption>Transaction's details</Caption>
					<div>
						<UserAvatar
							imageId={note.owner.image?.id}
							title={note.owner.name ?? note.owner.username}
						/>
						<div className="relative">
							<SeparatorRoot
								dashed
								orientation="vertical"
								className="h-9 border-success-500 pl-4"
							/>
							<span className="absolute left-10 top-1/2 -translate-y-1/2">
								<Caption size="xs">
									{formatDistanceToNow(new Date(note.createdAt))}
								</Caption>
							</span>
							<span className="-mt-4 pl-2 text-success-500">
								<Icon name="chevron-down" className="" />
							</span>
						</div>
						<UserAvatar
							imageId={note.receiver.image?.id}
							title={note.receiver.name ?? note.receiver.username}
						/>
					</div>
					<SeparatorRoot className="my-4" />
					<List as="ol" className="space-y-3 pl-0 [&_p]:text-nowrap">
						<li className="flex items-center justify-between gap-4">
							<Text size="sm" weight="bold">
								Amount
							</Text>
							<SeparatorRoot dashed />
							<Caption>{note.amount}</Caption>
						</li>
						<li className="flex items-center justify-between gap-4">
							<Text size="sm" weight="bold">
								Review
							</Text>
							<SeparatorRoot dashed />
							<Badge
								intent={note.reviewed === true ? 'success' : 'danger'}
								size="xs"
							>
								{note.reviewed === true ? 'YES' : 'NO'}
							</Badge>
						</li>

						<li className="flex items-center justify-between gap-4">
							<Text size="sm" weight="bold">
								Review At
							</Text>
							<SeparatorRoot dashed />
							<Caption className="text-nowrap">
								{!note.reviewedAt ? (
									<Caption>Not yet</Caption>
								) : (
									new Date(note.reviewedAt).toLocaleDateString('en-US', {
										month: 'long',
										day: 'numeric',
										year: 'numeric',
									})
								)}
							</Caption>
						</li>
						<li className="flex items-center justify-between gap-4">
							<Text size="sm" weight="bold">
								Status
							</Text>
							<SeparatorRoot dashed />
							<Badge
								size="xs"
								intent={transactionStatusToIntent(note.status as any)}
							>
								{note.status}
							</Badge>
						</li>
						<li className="flex items-center justify-between gap-4">
							<Text size="sm" weight="bold">
								Review By
							</Text>
							<SeparatorRoot dashed />
							<HoverCard.Root>
								<HoverCard.Trigger>
									<Links
										size="sm"
										className="text-nowrap"
										href={`/users/${note.reviewBy?.username}`}
									>
										{note.reviewBy?.name ?? note.reviewBy?.username}
									</Links>
								</HoverCard.Trigger>
								<HoverCard.Content fancy className="max-w-[250px]">
									<UserAvatar
										imageId={note.reviewBy?.image?.id}
										title={note.reviewBy?.name ?? note.reviewBy?.username}
										description={note.reviewBy?.username}
									/>
								</HoverCard.Content>
							</HoverCard.Root>
						</li>
						<li className="flex items-center justify-between gap-4">
							<Text size="sm" weight="bold">
								Transfer At
							</Text>
							<SeparatorRoot dashed />
							<Caption className="text-nowrap">
								{new Date(note.createdAt).toLocaleDateString('en-US', {
									month: 'long',
									day: 'numeric',
									year: 'numeric',
								})}
							</Caption>
						</li>
					</List>
					{isAdmin && note.reviewed === false && (
						<Card variant="soft" className="mt-8 h-full w-full space-y-3">
							<Text className="" size="lg" weight={'semibold'}>
								<Icon name="shield-heart" className="mr-2" />
								Change review status
							</Text>
							<Caption>
								As an <b>Adminstartor</b> you can force review this transaction
								to <Code intent="accent">completed</Code> without reviewer
								permission
							</Caption>
							<AdminMarkAsReviewed id={note.id} />
						</Card>
					)}
				</Card>
			</div>
		</div>
	)
}

export function AdminMarkAsReviewed({ id }: { id: string }) {
	const dc = useDoubleCheck()
	const isPending = useIsPending({
		formAction: '/history/' + id,
		formMethod: 'POST',
	})

	return (
		<Form method="POST" action={`/history/${id}`} className="">
			<input
				type="hidden"
				name="intent"
				value={ENUM_HISTORY_FORM_INTENT.ADMIN_MARK_AS_REVIEWED}
			/>
			<input type="hidden" name="transactionId" value={id} />
			<StatusButton
				{...dc.getButtonProps({
					className: 'w-full',
				})}
				status={isPending ? 'pending' : 'idle'}
				intent="secondary"
				type="submit"
				size="sm"
				variant="solid"
			>
				{!isPending && (
					<Button.Icon type="leading">
						<Icon name="circle-dashed-check" />
					</Button.Icon>
				)}
				<Button.Label>
					{dc.doubleCheck ? 'Are you sure?' : 'Mark as reviewed'}
				</Button.Label>
			</StatusButton>
		</Form>
	)
}

export function DeleteNote({ id }: { id: string }) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [form] = useForm({
		id: 'delete-note',
		// lastResult: actionData?.result,
	})

	return (
		<Form method="POST" {...getFormProps(form)}>
			<input type="hidden" name="noteId" value={id} />
			<StatusButton
				type="submit"
				name="intent"
				value="delete-note"
				intent="danger"
				status={isPending ? 'pending' : form.status ?? 'idle'}
				disabled={isPending}
				className="w-full max-md:aspect-square max-md:px-0"
			>
				<Icon name="trash" className="scale-125 max-md:scale-150">
					<span className="max-md:hidden">Delete</span>
				</Icon>
			</StatusButton>
			<ErrorList errors={form.errors} id={form.errorId} />
		</Form>
	)
}

export const meta: MetaFunction<
	typeof loader,
	{ 'routes/users+/$username_+/notes': typeof loader }
> = ({ data, params, matches }) => {
	const notesMatch = matches.find(
		(m) => m.id === 'routes/users+/$username_+/notes',
	)
	const displayName = notesMatch?.data?.note.title
	const noteTitle = data?.note.title ?? 'Note'
	const noteContentsSummary =
		data && data.note.content.length > 100
			? data?.note.content.slice(0, 97) + '...'
			: 'No content'
	return [
		{ title: `${noteTitle} | ${displayName}'s Notes | Epic Notes` },
		{
			name: 'description',
			content: noteContentsSummary,
		},
	]
}
export function MarkAsReviewed({ noteId }: { noteId: string }) {
	const [isMarked, setIsMarked] = useState(false)
	return (
		<div className="flex flex-col items-end gap-2">
			<Aligner>
				<Label htmlFor="review-confirmation">
					I confirm that the transaction is correct
				</Label>
				<Checkbox
					name="review-confirmation"
					checked={isMarked}
					onCheckedChange={(mark) => {
						setIsMarked(Boolean(mark.valueOf()))
					}}
				/>
			</Aligner>
			<Form method="POST" action={`/history/${noteId}`} className="">
				<input
					type="hidden"
					name="intent"
					value={ENUM_HISTORY_FORM_INTENT.MARK_AS_REVIEWED}
				/>
				<input type="hidden" name="transactionId" value={noteId} />
				<Button.Root
					size="sm"
					className="max-w-[200px]"
					disabled={!isMarked}
					type="submit"
				>
					<Button.Icon type="leading">
						<Icon name="check" className="" />
					</Button.Icon>
					<Button.Label>Mark as reviewed</Button.Label>
				</Button.Root>
			</Form>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				403: () => <p>You are not allowed to do that</p>,
				404: ({ params }) => (
					<p>No note with the id "{params.noteId}" exists</p>
				),
			}}
		/>
	)
}
