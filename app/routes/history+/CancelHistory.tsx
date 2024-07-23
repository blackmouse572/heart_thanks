import Alert from '#app/components/alert-dialog.js'
import Tooltip from '#app/components/tooltip.js'
import Button from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { useIsPending } from '#app/utils/misc.js'
import { useFetcher } from '@remix-run/react'
import { useState } from 'react'
import { ENUM_HISTORY_FORM_INTENT } from './$historyId'

type CancelHistoryAlertDialogProps = {
	id: string
}

function CancelHistoryAlertDialog(props: CancelHistoryAlertDialogProps) {
	const { id } = props
	const [open, setOpen] = useState(false)
	const fetcher = useFetcher()
	const isDeleteing = useIsPending({
		formAction: '/history' + id,
		formMethod: 'DELETE',
	})

	const submit = () => {
		const formData = new FormData()
		formData.append('intent', ENUM_HISTORY_FORM_INTENT.MARK_AS_CANCELLED)
		formData.append('transactionId', id)
		fetcher.submit(formData, {
			action: `/history/${id}`,
			method: 'POST',
		})
	}

	return (
		<Alert
			open={open}
			onOpenChange={setOpen}
			title={'Cancel Transaction'}
			description={'Would you like to cancel this transaction?'}
			contentProps={{
				className: 'w-full lg:max-w-md',
			}}
			action={
				<Button.Root intent="danger" disabled={isDeleteing} onClick={submit}>
					<Button.Label>Cancel this transaction</Button.Label>
				</Button.Root>
			}
			trigger={
				<Tooltip content="Cancel">
					<Button.Root
						variant="ghost"
						intent="danger"
						disabled={isDeleteing}
						onClick={() => {
							setOpen(true)
						}}
						size="xs"
					>
						<Button.Icon type="only">
							<Icon name={'x'} />
						</Button.Icon>
					</Button.Root>
				</Tooltip>
			}
			cancel={
				<Button.Root intent="gray" variant="outlined" disabled={isDeleteing}>
					<Button.Label>Return</Button.Label>
				</Button.Root>
			}
		></Alert>
	)
}

export default CancelHistoryAlertDialog
