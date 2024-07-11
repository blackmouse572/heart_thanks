import { cn } from '#app/utils/misc.js'
import { useOptionalUser } from '#app/utils/user.js'
import { Form, Link, useLocation } from '@remix-run/react'
import { useEffect, useState } from 'react'
import Button from './ui/button'
import { Icon } from './ui/icon'
import DropdownMenu from './ui/dropdown'
import { Role } from '@prisma/client'
import UserAvatar from './user-avatar'
import Badge from './ui/badge'
import { Caption, Title } from './ui/typography'

type NavbarItem = {
	title: string
	href: string
	icon?: React.ReactNode
	displayType?: 'user' | 'guest' | 'admin' | 'all' // default is all
}

const NAVBAR_ITEMS: NavbarItem[] = [
	{
		title: 'Home',
		href: '/',
		icon: <Icon name="home" />,
	},
	{
		title: 'Transfer History',
		href: '/history',
		displayType: 'user',
		icon: <Icon name="transfer" />,
	},
	{
		title: 'Login',
		href: '/login',
		icon: <Icon name="lock-open-1" />,
		displayType: 'guest',
	},
	{
		title: 'Profile',
		href: '/settings/profile',
		icon: <Icon name="avatar" />,
		displayType: 'user',
	},
	{
		title: 'Admin Panel',
		href: '/admin',
		icon: <Icon name="layout-dashboard" />,
		displayType: 'admin',
	},
]

export function SiteHeader() {
	const [isOpen, setIsOpen] = useState(false)
	const { pathname } = useLocation()
	const user = useOptionalUser()

	useEffect(() => {
		const root = document.querySelector('body') as HTMLElement
		const navItems = document.querySelector('#navItems') as HTMLElement

		if (isOpen) {
			navItems.style.setProperty(
				'--nav-items-height',
				`${navItems.scrollHeight}px`,
			)
			root.classList.add('overflow-hidden')
		} else {
			root.classList.remove('overflow-hidden')
			navItems.style.setProperty('--nav-items-height', '0px')
		}
	}, [isOpen])
	return (
		<>
			<header
				id={'header-nav'}
				data-state={isOpen ? 'open' : 'closed'}
				className="group card-shadow fixed inset-x-2 top-2 z-10 rounded border bg-white/50 dark:border-white/5 dark:bg-white/5 lg:relative lg:inset-x-0 lg:top-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none lg:dark:bg-transparent"
				style={{
					backdropFilter: 'blur(20px)',
				}}
			>
				<div className="mx-auto max-w-6xl px-6 py-3 sm:py-4 lg:flex lg:justify-between">
					<div className="lg:flex lg:items-center lg:gap-8">
						<div className="flex w-full items-center justify-between lg:w-fit">
							<Link to="/" aria-label="home">
								<Icon name="envelope-closed" />
							</Link>
							<div className="flex gap-2 lg:hidden">
								<Button.Root href="login" size="sm" intent="neutral">
									<Button.Label>Login</Button.Label>
								</Button.Root>

								<Button.Root
									onClick={() => setIsOpen(!isOpen)}
									intent="gray"
									size="sm"
									variant="ghost"
									aria-label="toggle menu button"
									className="relative -mr-3"
								>
									<Button.Icon
										size="md"
										type="only"
										className="absolute inset-0 m-auto -rotate-90 scale-125 opacity-0 duration-300 group-data-[state=open]:rotate-90 group-data-[state=open]:scale-100 group-data-[state=open]:opacity-100"
									>
										<Icon name="x" />
									</Button.Icon>
									<Button.Icon
										size="md"
										type="only"
										className="duration-300 group-data-[state=open]:rotate-90 group-data-[state=open]:scale-0"
									>
										<Icon name="menu" />
									</Button.Icon>
								</Button.Root>
							</div>
						</div>
						<nav
							id="navItems"
							className="-mx-3 h-[--nav-items-height] w-full overflow-hidden transition-[height] lg:feedback-shadow lg:fixed lg:inset-x-0 lg:top-6 lg:m-auto lg:mx-auto lg:flex lg:h-fit lg:w-fit lg:rounded lg:border lg:bg-white/50 lg:px-2 lg:py-2 lg:backdrop-blur-3xl lg:dark:border-white/5 lg:dark:bg-white/5"
						>
							<div
								className="absolute left-1.5 top-1.5 size-1 rounded-full bg-gray-950/10 dark:bg-white/20 lg:left-1 lg:top-1 lg:size-0.5"
								aria-hidden
							></div>
							<div
								className="absolute right-1.5 top-1.5 size-1 rounded-full bg-gray-950/10 dark:bg-white/20 lg:right-1 lg:top-1 lg:size-0.5"
								aria-hidden
							></div>
							<div
								className="absolute bottom-1.5 left-1.5 size-1 rounded-full bg-gray-950/10 dark:bg-white/20 lg:bottom-1 lg:left-1 lg:size-0.5"
								aria-hidden
							></div>
							<div
								className="absolute bottom-1.5 right-1.5 size-1 rounded-full bg-gray-950/10 dark:bg-white/20 lg:bottom-1 lg:right-1 lg:size-0.5"
								aria-hidden
							></div>

							<div
								className={cn(
									'items-center space-y-6 py-4 lg:flex lg:gap-1 lg:space-y-0 lg:py-0',
								)}
							>
								{NAVBAR_ITEMS.map(({ href, title, icon, displayType }) => {
									if (
										(displayType === 'user' || displayType === 'admin') &&
										!user
									)
										return null
									if (displayType === 'guest' && user) return null
									if (
										displayType === 'admin' &&
										user?.roles.find((a) => a.name === 'admin') === undefined
									)
										return null

									return (
										<NavLink
											isActive={href === pathname}
											key={href}
											href={href}
										>
											<div className="flex items-center gap-1">
												{icon}
												{title}
											</div>
										</NavLink>
									)
								})}
								{user && (
									<Button.Root size="sm" intent="secondary" href="/transfer">
										<Button.Icon>
											<Icon name="plus" />
										</Button.Icon>
										<Button.Label>Give love</Button.Label>
									</Button.Root>
								)}
							</div>
						</nav>
					</div>

					<div className="">
						{user ? (
							<LoggedSideItem user={user as any} />
						) : (
							// <Form action="/logout" method="POST" className="mt-3">
							// 	<Button.Root
							// 		type="submit"
							// 		variant="outlined"
							// 		intent="danger"
							// 		size="md"
							// 	>
							// 		<Button.Icon type="leading">
							// 			<Icon name="exit" />
							// 		</Button.Icon>
							// 		<Button.Label>Logout</Button.Label>
							// 	</Button.Root>
							// </Form>
							<Button.Root
								href="/login"
								size="xs"
								intent="gray"
								variant="outlined"
							>
								<Button.Label>Login</Button.Label>
							</Button.Root>
						)}
					</div>
				</div>
			</header>
			{isOpen && (
				<div
					onClick={() => setIsOpen(false)}
					data-state={isOpen ? 'open' : 'closed'}
					className="fixed inset-0 z-[9] bg-white/50 data-[state=open]:animate-overlayShow dark:bg-[--overlay-bg] lg:hidden"
					aria-hidden
					data-aria-hidden="true"
				/>
			)}
		</>
	)
}

type LoggedSideItemProps = {
	user: any
}

const LoggedSideItem = ({ user }: LoggedSideItemProps) => {
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<Button.Root
					size="sm"
					intent="secondary"
					variant="outlined"
					className="flex h-fit items-center justify-end gap-1"
				>
					<UserAvatar
						rtl
						imageId={user.image.id}
						title={user.name}
						description={user.vault ?? 0 + '💖'}
					/>
				</Button.Root>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content sideOffset={15} fancy>
					<div className="grid place-items-start gap-3 p-3 [grid-template-columns:auto_1fr]">
						<UserAvatar imageId={user.image.id} />
						<div>
							<Title className="text-sm" as="span" weight="medium">
								{user.name ?? user.username}
							</Title>
							<Caption className="flex flex-wrap gap-2">
								{user.username}
								<Badge size="xs">
									{user.roles.find((a: Role) => a.name === 'admin')
										? 'Admin'
										: 'User'}
								</Badge>
							</Caption>

							<div className="mt-4 grid grid-cols-2 gap-3" data-rounded="large">
								<Button.Root
									className="bg-gray-50"
									variant="outlined"
									href="/settings/profile?tab=Setting"
									size="xs"
									intent="gray"
								>
									<Button.Icon size="xs" type="leading">
										<Icon name="settings" />
									</Button.Icon>
									<Button.Label>Manage</Button.Label>
								</Button.Root>
								<Form action="/logout" method="POST">
									<Button.Root
										type="submit"
										variant="outlined"
										size="xs"
										intent="danger"
									>
										<Button.Icon type="leading">
											<Icon name="logout" size="xs" />
										</Button.Icon>
										<Button.Label>Logout</Button.Label>
									</Button.Root>
								</Form>
							</div>
						</div>
					</div>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<Link to="/settings/profile">
							<DropdownMenu.Item>
								<DropdownMenu.Icon>
									<Icon name="avatar" />
								</DropdownMenu.Icon>
								Profile
							</DropdownMenu.Item>
						</Link>
						<Link to="/settings/profile/password">
							<DropdownMenu.Item>
								<DropdownMenu.Icon>
									<Icon name="lock-open-1" />
								</DropdownMenu.Icon>
								Change password
							</DropdownMenu.Item>
						</Link>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<Link to="/docs/help">
							<DropdownMenu.Item>
								<DropdownMenu.Icon>
									<Icon name="question-mark-circled" />
								</DropdownMenu.Icon>
								Help
							</DropdownMenu.Item>
						</Link>
						<Link to="/docs/report-bug">
							<DropdownMenu.Item>
								<DropdownMenu.Icon>
									<Icon name="bug" />
								</DropdownMenu.Icon>
								Report a bug
							</DropdownMenu.Item>
						</Link>
						<Link to="/docs/feedback">
							<DropdownMenu.Item>
								<DropdownMenu.Icon>
									<Icon name="file-text" />
								</DropdownMenu.Icon>
								Feedback
							</DropdownMenu.Item>
						</Link>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	)
}

const NavLink = ({
	href,
	children,
	isActive,
}: {
	href: string
	children: React.ReactNode
	isActive?: boolean
}) => (
	<Button.Root
		variant={isActive ? 'soft' : 'ghost'}
		intent={!isActive ? 'gray' : 'primary'}
		size="xs"
		href={href}
		className="justify-start"
	>
		<Button.Label>{children}</Button.Label>
	</Button.Root>
)
