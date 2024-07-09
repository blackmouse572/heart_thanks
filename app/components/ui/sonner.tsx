import { toast } from '@tailus/themer'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const { title, description } = toast()

const EpicToaster = ({ theme, ...props }: ToasterProps) => {
	return (
		<Sonner
			theme={theme}
			className="toaster group"
			richColors
			toastOptions={{
				classNames: {
					toast:
						'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
					description: description({
						className: 'group-[.toast]:text-muted-foreground',
					}),
					title: title({}),
					actionButton:
						'group-[.toast]:bg-primary-500 group-[.toast]:text-primary-50',
					cancelButton:
						'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
				},
			}}
			{...props}
		/>
	)
}

export { EpicToaster }
