import Button from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'
import Input from '#app/components/ui/input.js'
import Label from '#app/components/ui/typography/label.js'
import Popover from '#app/components/ui/popover'
import Slider from '#app/components/ui/slider'
import { Text } from '#app/components/ui/typography/text.js'
import {
	cn,
	getUserImgSrc,
	useDebounce,
	useIsPending,
} from '#app/utils/misc.js'
import { Metadata } from '#app/utils/request.server.js'
import {
	Form,
	useFetcher,
	useLocation,
	useSearchParams,
	useSubmit,
} from '@remix-run/react'
import React, { useCallback, useEffect, useId } from 'react'
import Select from '#app/components/ui/select.js'
import { loader as userLoader } from '#app/routes/users+/index.tsx'
import { Caption } from '#app/components/ui/typography/caption.js'
import {
	Command,
	CommandInput,
	CommandEmpty,
	CommandList,
	CommandItem,
} from '#app/components/ui/command.js'
import SeparatorRoot from '#app/components/ui/seperator.js'
import UserAvatar from '#app/components/user-avatar.js'
import { User } from '@prisma/client'
type UserLoader = typeof userLoader
type UserLoaderData = Awaited<
	ReturnType<Awaited<ReturnType<typeof userLoader>>['json']>
>['users'][0]

type FilterItemProps = {
	metadata: Metadata & {
		min: number
		max: number
	}
}
const reviewedOptions = [
	{
		label: 'Yes',
		value: 'true',
	},
	{
		label: 'No',
		value: 'false',
	},
	{
		label: 'All',
		value: 'all',
	},
]

function FilterItem({ metadata }: FilterItemProps) {
	const { filter, reviewer } = metadata
	const id = useId()
	const [searchParams] = useSearchParams()
	const location = useLocation()
	const submit = useSubmit()
	const [range, setRange] = React.useState(() =>
		filter.min ? [filter.min, filter.max] : [metadata.min, metadata.max],
	)

	const reset = () => {
		const data = new FormData()
		data.append('search', '')
		data.append('min', metadata.min.toString())
		data.append('max', metadata.max.toString())
		setRange([metadata.min, metadata.max])
		submit(data)
	}

	const setRangeChange = (value: string, index: number) => {
		if (value === '') return
		const val = parseInt(value)

		if (index === 0) {
			setRange([val, range[1] || metadata.max])
		} else {
			setRange([range[0] || metadata.min, val])
		}
	}

	const handleFormChange = useDebounce((form: HTMLFormElement) => {
		submit(form)
	}, 400)

	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<Button.Root variant="outlined" intent="gray" isIcon>
					<Button.Icon type="only">
						<Icon name="filter" />
					</Button.Icon>
				</Button.Root>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					sideOffset={10}
					mixed
					align="end"
					className="max-w-xs p-0"
				>
					<div className="mb-4 flex items-center gap-3 border-b border-[--ui-border-color] px-3 py-3">
						<Icon name="filter" className="text-primary-500" />
						<Text weight={'medium'}>Filter</Text>
					</div>

					<Form
						method="GET"
						action={location.pathname}
						className="space-y-4 px-3 pb-4"
						onChange={(e) => handleFormChange(e.currentTarget)}
					>
						<div className="flex-1">
							<Label htmlFor={id} className="sr-only">
								Search
							</Label>
							<Input
								type="search"
								name="search"
								id={id}
								defaultValue={searchParams.get('search') ?? ''}
								placeholder="Search"
								className="w-full"
								// autoFocus={autoFocus}
							/>
						</div>

						{/* Range amount */}
						<div className="flex-1 space-y-1">
							<Label htmlFor={id}>Amount</Label>
							<div className="flex gap-5">
								<Input
									type="number"
									name="min"
									placeholder="Min"
									value={range[0]}
									onChange={(e) => {
										const value = e.target.value
										setRangeChange(value, 0)
									}}
									max={metadata.max}
									min={metadata.min}
								/>
								<Input
									type="number"
									name="max"
									placeholder="Max"
									value={range[1]}
									min={metadata.min}
									max={metadata.max}
									onChange={(e) => {
										const value = e.target.value
										setRangeChange(value, 1)
									}}
								/>
							</div>
							<Slider.Root
								min={metadata.min}
								max={metadata.max}
								step={1}
								defaultValue={[metadata.min, metadata.max]}
								value={range}
								onValueChange={(value) => setRange(value)}
							>
								<Slider.Track>
									<Slider.Range />
								</Slider.Track>
								<Slider.Thumb />
								<Slider.Thumb />
							</Slider.Root>
						</div>

						{/* Select need review */}

						<div className="flex-1 space-y-1">
							<Label htmlFor={'needReview'}>Has reviewed</Label>

							<Select.Root
								name="needReview"
								defaultValue={
									searchParams.get('needReview') ?? reviewedOptions[2]?.value
								}
							>
								<Select.Trigger size="md" className="" name="reviewed">
									<Select.Value placeholder="Role" />
								</Select.Trigger>

								<Select.Portal>
									<Select.Content mixed className="z-50">
										<Select.Viewport>
											{reviewedOptions.map((option) => (
												<Select.Item
													key={option.value}
													value={option.value}
													className="items-center pl-7"
												>
													<Select.ItemText>{option.label}</Select.ItemText>
													<Select.ItemIndicator />
												</Select.Item>
											))}
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
						</div>
						<UserSelector label="Reviewer" defaultValue={reviewer} />
						<SeparatorRoot />

						<Button.Root
							type="reset"
							variant="outlined"
							className="ml-auto"
							intent="primary"
							size="sm"
							onClick={reset}
						>
							<Button.Label>Reset</Button.Label>
						</Button.Root>
					</Form>
					<Popover.Close asChild>
						<Button.Root variant="ghost" size="sm" intent="gray">
							<Button.Icon type="only">
								<Icon name="x" />
							</Button.Icon>
						</Button.Root>
					</Popover.Close>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	)
}

type UserSelectorProps = {
	// users: UserLoaderData[]
	// field: FieldMetadata
	label: string
	required?: boolean
	defaultValue: User & { image: { id: string } }
	labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>
}

function UserSelector({
	label,
	required,
	defaultValue,
	labelProps,
}: Readonly<UserSelectorProps>) {
	const [open, setOpen] = React.useState(false)
	const [value, setValue] = React.useState<string>()
	const [user, setUser] = React.useState<UserLoaderData>()
	const [searchParams, setSearchParams] = useSearchParams()
	const fetcher = useFetcher<UserLoader>()

	useEffect(() => {
		fetcher.load('/users', {})
	}, [])

	useEffect(() => {
		defaultValue &&
			setUser({
				id: defaultValue.id,
				username: defaultValue.username,
				name: defaultValue.name,
				imageId: defaultValue.image.id,
			})
	}, [defaultValue])

	const onUserSelect = useCallback(
		(joinedId: string) => {
			const users = fetcher.data?.users ?? []
			const [id] = joinedId.split('|')
			const user = users.find((u) => u?.id === id)

			if (user) {
				setValue(user.id)
				setOpen(false)
				setUser(user)
				const newSearchParams = new URLSearchParams(searchParams)
				newSearchParams.set('reviewer', user.username)
				setSearchParams(newSearchParams, { preventScrollReset: true })
			} else {
				console.error('User not found')
				console.log({ id, users })
			}
		},
		[fetcher.data, searchParams, setSearchParams],
	)

	const handleFormChange = useDebounce((value: string) => {
		if (value === '') {
			return fetcher.load('/users', {})
		}
		return fetcher.load(`/users?search=${value}`, {})
	}, 500)
	const isFetching =
		fetcher.state === 'submitting' || fetcher.state === 'loading'
	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<div>
				<Label {...labelProps}>{label}</Label>
				<div className="flex w-full items-center gap-1">
					<Label
						{...labelProps}
						className={cn('text-[--caption-text-color]')}
					/>
					{required && (
						<span className="text-danger-500" aria-hidden="true">
							*
						</span>
					)}
				</div>
				<Popover.Trigger asChild>
					<Button.Root
						size="lg"
						aria-expanded={open}
						variant="outlined"
						intent="gray"
						className="h-auto min-h-9 w-full justify-between overflow-hidden"
					>
						<Button.Label>
							{user ? (
								<UserAvatar
									imageId={user.imageId ?? undefined}
									title={user.name ?? user.username}
								/>
							) : (
								'Select User...'
							)}
						</Button.Label>
						<Button.Icon>
							<Icon
								name="chevron-down"
								className="ml-2 h-4 w-4 shrink-0 opacity-50"
							/>
						</Button.Icon>
					</Button.Root>
				</Popover.Trigger>
				{/* {errorId && (
					<div className="min-h-[32px] pb-3 pt-1 text-danger-500">
						<ErrorList id={errorId} errors={field.errors} />
					</div>
				)} */}
			</div>
			<Popover.Portal>
				<Popover.Content className="w-[300px] p-0" fancy>
					<Command className="border-0 p-0" shouldFilter={false}>
						<CommandInput
							placeholder="Search user..."
							onValueChange={handleFormChange}
							isLoading={isFetching}
						/>
						<CommandEmpty>No users found.</CommandEmpty>
						<CommandList>
							{fetcher.data?.users.map(
								(framework) =>
									framework && (
										<CommandItem
											key={framework.id}
											value={[
												framework.id,
												framework.username,
												framework.name,
											].join('|')}
											onSelect={onUserSelect}
											aria-disabled={undefined}
											data-disabled={undefined}
											className="space-x-8"
											variant={value === framework.id ? 'soft' : 'ghost'}
										>
											<Icon
												name="check"
												className={cn(
													'h-4 w-4',
													value === framework.id ? 'opacity-100' : 'opacity-0',
												)}
											/>
											<img
												src={getUserImgSrc(framework.imageId)}
												alt={framework.name ?? framework.username}
												className="h-6 w-6 rounded-full"
											/>
											<div className="text-start">
												<Text>{framework.name}</Text>
												<Caption>{framework.username}</Caption>
											</div>
										</CommandItem>
									),
							)}
						</CommandList>
					</Command>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	)
}

export default FilterItem
