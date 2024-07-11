import Drawer from './ui/drawer'

export type SlidePanelProps = {
	title: string
	description?: string
	children: React.ReactNode
	trigger: React.ReactNode
	rootProps?: React.ComponentProps<typeof Drawer.Root>
	withCloseButton?: boolean
}
function SlidePanel({
	children,
	title,
	description,
	withCloseButton = true,
	rootProps,
	trigger,
}: Readonly<SlidePanelProps>) {
	return (
		<Drawer.Root shouldScaleBackground {...rootProps}>
			<Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Overlay />
				<Drawer.Content>
					{withCloseButton && <Drawer.Close />}
					<div>
						<Drawer.Title>{title}</Drawer.Title>
						<Drawer.Description>{description}</Drawer.Description>
					</div>
					{children}
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	)
}

export default SlidePanel
