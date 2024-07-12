import Drawer from './ui/drawer'

export type SlidePanelProps = {
	title: string
	description?: string
	children: React.ReactNode
	trigger: React.ReactNode
	rootProps?: React.ComponentProps<typeof Drawer.Root>
	withCloseButton?: boolean
	open?: boolean
	setOpen?: (open: boolean) => void
}
function SlidePanel({
	children,
	title,
	description,
	withCloseButton = true,
	rootProps,
	trigger,
	open,
	setOpen,
}: Readonly<SlidePanelProps>) {
	return (
		<Drawer.Root
			direction="right"
			{...rootProps}
			onOpenChange={setOpen}
			open={open}
		>
			<Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Overlay className="z-[11]" />
				<Drawer.Content className="inset-auto bottom-4 right-3 top-4 z-[11] flex min-w-[500px] flex-col overflow-visible rounded-[--feedback-radius]">
					{withCloseButton && <Drawer.Close />}
					<div className="mb-5">
						<Drawer.Title size="lg">{title}</Drawer.Title>
						<Drawer.Description>{description}</Drawer.Description>
					</div>
					{children}
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	)
}

export default SlidePanel
