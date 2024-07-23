import AlertDialog from '#app/components/ui/alert.js'
import Button from '#app/components/ui/button.js'
import { useIsPending } from '#app/utils/misc.js'
import { Role } from '@prisma/client'
import { useActionData, useFetcher } from '@remix-run/react'
import { action } from './roles.tsx'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { List } from '#app/components/ui/typography/list.js'
import { Text } from '#app/components/ui/typography/text.js'
import { Caption } from '#app/components/ui/typography/caption.js'

type DeleteRoleAlertProps = {
	roles: Pick<Role, 'id' | 'name'>[]
	open: boolean
	setOpen: (s: boolean) => void
}
function DeleteRoleAlert({ setOpen, open, roles }: DeleteRoleAlertProps) {
	const fetcher = useFetcher()

	const handleDelete = async () => {
		const formData = new FormData()
		roles.forEach((role) => {
			formData.append('id', role.id)
		})
		fetcher.submit(formData, {
			method: 'DELETE',
			action: '/admin/roles',
		})
	}

	const bodyMessage = useCallback(() => {
		if (roles.length <= 5) {
			return (
				<>
					<Text>Are you sure you want to delete the following roles?</Text>
					<List className="mt-3 text-start">
						{roles.map((role) => (
							<li key={role.id}>
								<Caption>{role.name}</Caption>
							</li>
						))}
					</List>
				</>
			)
		}

		return <Text>Are you sure you want to delete {roles.length} roles?</Text>
	}, [roles])

	return (
		<AlertDialog.Root onOpenChange={setOpen} open={open}>
			<AlertDialog.Portal>
				<AlertDialog.Overlay />
				<AlertDialog.Content className="max-w-md">
					<AlertDialog.Title align="center">
						Are you absolutely sure?
					</AlertDialog.Title>
					<AlertDialog.Description align="center" className="mt-2">
						{bodyMessage()}
					</AlertDialog.Description>
					<AlertDialog.Actions className="justify-center">
						<AlertDialog.Cancel asChild>
							<Button.Root variant="outlined" intent="gray" size="sm">
								<Button.Label>Cancel</Button.Label>
							</Button.Root>
						</AlertDialog.Cancel>
						<AlertDialog.Action asChild>
							<Button.Root
								variant="solid"
								intent="danger"
								size="sm"
								onClick={handleDelete}
							>
								<Button.Label>Yes, Delete</Button.Label>
							</Button.Root>
						</AlertDialog.Action>
					</AlertDialog.Actions>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	)
}

export default DeleteRoleAlert
