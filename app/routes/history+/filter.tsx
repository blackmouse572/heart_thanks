import Button from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'
import Input from '#app/components/ui/input.js'
import Label from '#app/components/ui/typography/label.js'
import Popover from '#app/components/ui/popover'
import Slider from '#app/components/ui/slider'
import { Text } from '#app/components/ui/typography/text.js'
import { useDebounce, useIsPending } from '#app/utils/misc.js'
import { Metadata } from '#app/utils/request.server.js'
import { Form, useLocation, useSearchParams, useSubmit } from '@remix-run/react'
import React, { useId } from 'react'
type FilterItemProps = {
	metadata: Metadata & {
		min: number
		max: number
	}
}
function FilterItem({ metadata }: FilterItemProps) {
	const { filter } = metadata
	const id = useId()
	const [searchParams] = useSearchParams()
	const location = useLocation()
	const submit = useSubmit()
	const isSubmitting = useIsPending()
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

						<Button.Root
							type="reset"
							variant="outlined"
							className="ml-auto"
							intent="primary"
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

export default FilterItem
