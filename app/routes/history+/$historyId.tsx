import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import {
	Form,
	Link,
	useActionData,
	useLoaderData,
	type MetaFunction,
} from '@remix-run/react'
import { formatDistanceToNow } from 'date-fns'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import Button from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getNoteImgSrc, useIsPending } from '#app/utils/misc.tsx'
import { requireUserWithPermission } from '#app/utils/permissions.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import {
	userHasPermission,
	useOptionalUser,
	userHasRole,
	useUser,
} from '#app/utils/user.ts'
import Card from '#app/components/ui/card.js'
import { Title } from '#app/components/ui/typography/title.js'
import { Caption } from '#app/components/ui/typography/caption.js'
import { Text } from '#app/components/ui/typography/text.js'
import Annouce from '#app/components/ui/annouce.js'
import { List } from '#app/components/ui/typography/list.js'
import UserAvatar from '#app/components/user-avatar.js'
import SeparatorRoot from '#app/components/ui/seperator.js'
import Badge from '#app/components/ui/badge.js'
import HoverCard from '#app/components/ui/hover-card.js'
import { Link as Links } from '#app/components/ui/typography/link'
import { Code } from '#app/components/ui/typography/code.js'

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

const ENUM_FORM_INTENT = {
	MARK_AS_REVIEWED: 'MARK_AS_REVIEWED',
	ADMIN_MARK_AS_REVIEWED: 'ADMIN_MARK_AS_REVIEWED',
}
const AdminMarkAsReviewedSchema = z.object({
	intent: z.enum([
		ENUM_FORM_INTENT.MARK_AS_REVIEWED,
		ENUM_FORM_INTENT.ADMIN_MARK_AS_REVIEWED,
	]),
	transactionId: z.string(),
	changeToAdmin: z.boolean().default(false), // this will change reviewBy to admin (currentUser)
})

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent') as string
	if (intent === ENUM_FORM_INTENT.ADMIN_MARK_AS_REVIEWED) {
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
			},
			where: { id: noteId },
		})
		invariantResponse(note, 'Not found', { status: 404 })

		const isOwner = note.ownerId === userId
		await requireUserWithPermission(
			request,
			isOwner ? `delete:note:own` : `delete:note:any`,
		)

		await prisma.transactions.delete({ where: { id: note.id } })

		return redirectWithToast(`/history/${note.id}`, {
			type: 'success',
			title: 'Success',
			description: 'Transaction has been reviewed',
		})
	}
}

export default function NoteRoute() {
	const data = useLoaderData<typeof loader>()
	const { note } = data
	const user = useUser()
	const isOwner = user?.id === data.note.ownerId
	const canReview = user?.id === data.note.reviewBy?.id
	console.log(user)
	const isAdmin = userHasRole(user as any, 'admin')
	const displayBar = canReview || isOwner

	return (
		<div className="container mt-5">
			<div className="grid place-items-start gap-4 lg:grid-cols-4">
				<Card variant="outlined" className="col-span-3 w-full cursor-default">
					<header className="flex justify-between">
						<div>
							<Text size={'sm'}>Transaction {note.id}</Text>
							<Title>{note.title}</Title>
							<Caption>{note.content}</Caption>
						</div>
					</header>
				</Card>
				<Card variant="outlined" className="col-span-1 row-span-2 w-full">
					<Title>Details</Title>
					<Caption>Transaction's details</Caption>
					<div>
						<UserAvatar
							imageId={note.owner.image?.id}
							title={note.owner.name || note.owner.username}
						/>
						<div className="">
							<SeparatorRoot
								dashed
								orientation="vertical"
								className="h-9 border-success-500 pl-4"
							/>
							<span className="-mt-4 pl-2 text-success-500">
								<Icon name="chevron-down" className="" />
							</span>
						</div>
						<UserAvatar
							imageId={note.receiver.image?.id}
							title={note.receiver.name || note.receiver.username}
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
								{note.reviewedAt
									? formatDistanceToNow(new Date(note.reviewedAt))
									: 'Not yet'}
							</Caption>
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
										href={`/users/${note.reviewBy?.id}`}
									>
										{note.reviewBy?.name || note.reviewBy?.username}
									</Links>
								</HoverCard.Trigger>
								<HoverCard.Content fancy className="max-w-[250px]">
									<UserAvatar
										imageId={note.reviewBy?.image?.id}
										title={note.reviewBy?.name || note.reviewBy?.username}
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
								{note.createdAt
									? formatDistanceToNow(new Date(note.createdAt))
									: 'Not yet'}
							</Caption>
						</li>
					</List>
					{isAdmin && (
						<Card variant="soft" className="mt-8 h-full w-full space-y-3">
							<Text className="" size="lg" weight={'semibold'}>
								Review this transaction
							</Text>
							<Caption>
								As an <b>Adminstartor</b> you can force review this transaction
								to <Code intent="accent">completed</Code> without reviewer
								permission
							</Caption>
							<Button.Root
								intent="secondary"
								className="w-full"
								variant="solid"
							>
								<Button.Icon type="leading">
									<Icon name="check" className="scale-125 max-md:scale-150" />
								</Button.Icon>
								<Button.Label>Mark as reviewed</Button.Label>
							</Button.Root>
						</Card>
					)}
				</Card>
			</div>
		</div>
	)
}

export function DeleteNote({ id }: { id: string }) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [form] = useForm({
		id: 'delete-note',
		lastResult: actionData?.result,
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
