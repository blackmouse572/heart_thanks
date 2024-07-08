import { cn } from '#app/utils/misc.js'
import { useOptionalUser } from '#app/utils/user.js'
import { useLocation, useMatches } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { SearchBar } from './search-bar'
import Button from './ui/button'
import { Icon } from './ui/icon'

type NavbarItem = {
	title: string
	href: string
	icon?: React.ReactNode
}

const NAVBAR_ITEMS: NavbarItem[] = [
	{
		title: 'Home',
		href: '/',
		icon: <Icon name="home" />,
	},

	{
		title: 'Contact',
		href: '/contact',
		icon: <Icon name="cross-1" />,
	},
]

export function SiteHeader() {
	const [isOpen, setIsOpen] = useState(false)
	const { pathname } = useLocation()
	const matches = useMatches()
	const isOnSearchPage = matches.find((m) => m.id === 'routes/users+/index')
	const user = useOptionalUser()
	const searchBar = isOnSearchPage ? null : <SearchBar status="idle" />

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
				data-state={isOpen ? 'open' : 'closed'}
				data-shade="glassy"
				className="group card-shadow fixed inset-x-2 top-2 z-10 rounded border bg-white/50 dark:border-white/5 dark:bg-white/5 lg:relative lg:inset-x-0 lg:top-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none lg:dark:bg-transparent"
				style={{
					backdropFilter: 'blur(20px)',
				}}
			>
				<div className="mx-auto max-w-6xl px-6 py-3 sm:py-4 lg:flex lg:justify-between">
					<div className="lg:flex lg:items-center lg:gap-8">
						<div className="flex w-full items-center justify-between lg:w-fit">
							<a href="/" aria-label="home">
								<Icon name="envelope-closed" />
							</a>
							<div className="flex gap-2 lg:hidden">
								<Button.Root
									href="/examples/forms/login2"
									size="sm"
									intent="neutral"
								>
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
									'space-y-6 py-4 lg:flex lg:gap-1 lg:space-y-0 lg:py-0',
								)}
							>
								{NAVBAR_ITEMS.map(({ href, title }) => (
									<NavLink isActive={href === pathname} key={href} href={href}>
										{title}
									</NavLink>
								))}
							</div>
						</nav>
					</div>

					<div className="hidden gap-2 lg:flex">
						{user ? (
							<Button.Root intent="secondary" href="/transfer">
								<Button.Icon>
									<Icon name="plus" />
								</Button.Icon>
								<Button.Label>Give love</Button.Label>
							</Button.Root>
						) : (
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
					className="data-[state=open]:animate-overlayShow fixed inset-0 z-[9] bg-white/50 dark:bg-[--overlay-bg] lg:hidden"
					aria-hidden
					data-aria-hidden="true"
				/>
			)}
		</>
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
