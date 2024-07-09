import Button from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'
import Input from '#app/components/ui/input.js'
import Label from '#app/components/ui/label.js'
import Popover from '#app/components/ui/popover'
import Slider from '#app/components/ui/slider'
import { Text } from '#app/components/ui/text.js'
import { useDebounce, useIsPending } from '#app/utils/misc.js'
import { Form, useLocation, useSearchParams, useSubmit } from '@remix-run/react'
import React, { useId } from 'react'
function FilterItem() {
	const id = useId()
	const [searchParams] = useSearchParams()
	const location = useLocation()
	const submit = useSubmit()
	const isSubmitting = useIsPending()
	const [range, setRange] = React.useState([100, 0])

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
				<Popover.Content sideOffset={10} mixed align="end" className="max-w-xs">
					<div className="mb-4 flex items-center gap-3 border-b border-[--ui-border-color] py-2">
						<Icon name="filter" className="text-primary-500" />
						<Text weight={'medium'}>Filter</Text>
					</div>

					<Form
						method="GET"
						action={location.pathname}
						className="space-y-8"
						onChange={(e) => handleFormChange(e.currentTarget)}
					>
						{/* <SearchBar /> */}
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
						<div className="flex-1">
							<Label htmlFor={id}>Amount</Label>
							<div className="flex gap-5">
								<Input
									type="number"
									name="min"
									placeholder="Min"
									value={range[0]}
									onChange={(e) => {
										const value = e.target.value
										setRange((prev) => {
											const [min, max] = prev
											if (value === '') return [min, 0]
											return [min || 0, parseInt(value) || 100]
										})
									}}
								/>
								<Input
									type="number"
									name="max"
									placeholder="Max"
									value={range[1]}
									onChange={(e) => {
										const value = e.target.value
										setRange((prev) => {
											const [min, max] = prev
											if (value === '') return [min, 0]
											return [min, parseInt(value)]
										})
									}}
								/>
							</div>
							<Slider.Root defaultValue={[100, 0]} step={10}>
								<Slider.Track>
									<Slider.Range />
								</Slider.Track>
								<Slider.Thumb />
								<Slider.Thumb />
							</Slider.Root>
						</div>
						<div className="grid grid-cols-3 gap-2">
							<Button.Root
								type="submit"
								className="col-span-2 flex-1"
								intent="primary"
							>
								<Button.Label>Apply Filter</Button.Label>
							</Button.Root>
							<Button.Root type="reset" variant="outlined" intent="primary">
								<Button.Label>Reset</Button.Label>
							</Button.Root>
						</div>
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

export default FilterItem
