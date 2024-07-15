import { DialogProps } from '@tailus/themer'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import AlertDialog from './ui/alert.tsx'

type AlertProps = React.ComponentProps<typeof AlertDialogPrimitive.Root> &
	DialogProps & {
		title: string
		description?: React.ReactNode
		trigger: React.ReactNode
		contentProps?: React.ComponentProps<typeof AlertDialogPrimitive.Content>
		cancel: React.ReactNode
		action: React.ReactNode
	}
function Alert(props: AlertProps) {
	const { title, cancel, action, description, contentProps, ...rest } = props
	return (
		<AlertDialog.Root {...rest}>
			<AlertDialog.Trigger asChild>{props.trigger}</AlertDialog.Trigger>
			<AlertDialog.Portal>
				<AlertDialog.Overlay />
				<AlertDialog.Content {...contentProps}>
					<AlertDialog.Title align="center">{title}</AlertDialog.Title>
					{description && (
						<AlertDialog.Description align="center">
							{description}
						</AlertDialog.Description>
					)}
					<AlertDialog.Actions className="justify-center">
						<AlertDialog.Cancel asChild>{cancel}</AlertDialog.Cancel>
						<AlertDialog.Action asChild>{action}</AlertDialog.Action>
					</AlertDialog.Actions>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	)
}

export default Alert
