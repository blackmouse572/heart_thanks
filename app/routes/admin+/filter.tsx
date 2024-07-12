import Button from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import Input from '#app/components/ui/input.js'
import Popover from '#app/components/ui/popover.js'
import SeparatorRoot from '#app/components/ui/seperator.js'
import Label from '#app/components/ui/typography/label.js'
import { Text } from '#app/components/ui/typography/text.js'
import { useDebounce } from '#app/utils/misc.js'
import { Metadata } from '#app/utils/request.server.js'
import { Form, useLocation, useSearchParams, useSubmit } from '@remix-run/react'
import { useId } from 'react'

type FilterItemProps = {
	metadata: Metadata
}
function FilterItem() {
	const submit = useSubmit()
	const location = useLocation()
	const id = useId()
	const [searchParams] = useSearchParams()
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
							<Label className="sr-only">Search</Label>
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

						<SeparatorRoot />

						<Button.Root
							type="reset"
							variant="outlined"
							className="ml-auto"
							intent="primary"
							size="sm"
							// onClick={reset}
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
