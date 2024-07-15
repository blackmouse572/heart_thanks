import Alert from '#app/components/alert-dialog.js'
import Button from '#app/components/ui/button.js'
import { useFetcher } from '@remix-run/react'
import { action as userLoader, LoaderDataUser } from './users'
import { useCallback, useEffect } from 'react'
import { useIsPending } from '#app/utils/misc.js'
import { toast } from 'sonner'

type DeleteUserProps = {
	open: boolean
	setOpen: (open: boolean) => void
	users: LoaderDataUser[]
}

function DeleteUser(props: DeleteUserProps) {
	const { open, setOpen, users } = props
	const fetcher = useFetcher<typeof userLoader>()
	const isDeleteing = useIsPending({
		formAction: '/admin/users',
		formMethod: 'DELETE',
	})

	useEffect(() => {
		const result = fetcher.data?.result as any
		if (!result) return
		if (fetcher.state === 'idle' && result.ok) {
			toast.success(`${result.amount} user(s) deleted successfully`)
			setOpen(false)
		}
	}, [fetcher])

	const label = users.length > 1 ? 'Delete Users' : 'Delete User'
	const description =
		users.length > 1
			? 'Are you sure you want to delete these users?'
			: 'Are you sure you want to delete this user?'

	const submit = useCallback(() => {
		// Delete user
		const formData = new FormData()
		formData.append('ids', users.map((u) => u.id).join(','))

		fetcher.submit(formData, {
			action: '/admin/users',
			method: 'DELETE',
		})
	}, [])

	return (
		<Alert
			open={open}
			onOpenChange={setOpen}
			title={label}
			description={description}
			contentProps={{
				className: 'w-full lg:max-w-md',
			}}
			action={
				<Button.Root
					intent="danger"
					disabled={isDeleteing}
					onClick={() => {
						submit()
					}}
				>
					<Button.Label>Delete</Button.Label>
				</Button.Root>
			}
			trigger={<></>}
			cancel={
				<Button.Root intent="gray" variant="outlined" disabled={isDeleteing}>
					<Button.Label>Cancel</Button.Label>
				</Button.Root>
			}
		></Alert>
	)
}

export default DeleteUser
