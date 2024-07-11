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
import { userHasPermission, useOptionalUser } from '#app/utils/user.ts'
import { type loader as notesLoader } from './notes.tsx'
import Card from '#app/components/ui/card.js'
import { Title } from '#app/components/ui/typography/title.js'
import { Caption } from '#app/components/ui/typography/caption.js'
import { Text } from '#app/components/ui/typography/text.js'

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
		where: { id: params.noteId },
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

const DeleteFormSchema = z.object({
	intent: z.literal('delete-note'),
	transactionId: z.string(),
})

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteFormSchema,
	})
	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { transactionId: noteId } = submission.value

	const note = await prisma.transactions.findFirst({
		select: { id: true, ownerId: true, owner: { select: { username: true } } },
		where: { id: noteId },
	})
	invariantResponse(note, 'Not found', { status: 404 })

	const isOwner = note.ownerId === userId
	await requireUserWithPermission(
		request,
		isOwner ? `delete:note:own` : `delete:note:any`,
	)

	await prisma.transactions.delete({ where: { id: note.id } })

	return redirectWithToast(`/users/${note.owner.username}/notes`, {
		type: 'success',
		title: 'Success',
		description: 'Your note has been deleted.',
	})
}

export default function NoteRoute() {
	const data = useLoaderData<typeof loader>()
	const { note } = data
	const user = useOptionalUser()
	const isOwner = user?.id === data.note.ownerId
	const canReview = user?.id === data.note.reviewBy?.id
	const displayBar = canReview || isOwner

	return (
		<Card className="container mt-5 min-h-[80vh]">
			<Text size={'sm'}>Transaction {note.id}</Text>
			<Title>{note.title}</Title>
			<Caption>{note.content}</Caption>
			<div className={`${displayBar ? 'pb-24' : 'pb-12'} overflow-y-auto`}>
				<ul className="flex flex-wrap gap-5 py-5"></ul>
				<p className="whitespace-break-spaces text-sm md:text-lg">
					{data.note.content}
				</p>
			</div>
			{displayBar ? (
				<div className={floatingToolbarClassName}>
					<span className="text-foreground/90 text-sm max-[524px]:hidden">
						<Icon name="clock" className="scale-125">
							{data.timeAgo} ago
						</Icon>
					</span>
					<div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
						{canReview ? <DeleteNote id={data.note.id} /> : null}
						<Link to="edit">
							<Button.Root>
								<Button.Icon type="leading">
									<Icon
										name="pencil-1"
										className="scale-125 max-md:scale-150"
									/>
								</Button.Icon>
								<Button.Label>
									<span className="max-md:hidden">Edit</span>
								</Button.Label>
							</Button.Root>
						</Link>
					</div>
				</div>
			) : null}
		</Card>
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
	{ 'routes/users+/$username_+/notes': typeof notesLoader }
> = ({ data, params, matches }) => {
	const notesMatch = matches.find(
		(m) => m.id === 'routes/users+/$username_+/notes',
	)
	const displayName = notesMatch?.data?.owner.name ?? params.username
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
