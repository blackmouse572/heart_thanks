import Button from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { Input } from '#app/components/ui/input.js'
import Label from '#app/components/ui/label.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { useDebounce, useIsPending } from '#app/utils/misc.js'
import { Form, useLocation, useSearchParams, useSubmit } from '@remix-run/react'
import { useId } from 'react'

export function SearchBar({
	status,
	autoFocus = false,
	autoSubmit = false,
}: {
	status: 'idle' | 'pending' | 'success' | 'error'
	autoFocus?: boolean
	autoSubmit?: boolean
}) {
	const id = useId()
	const [searchParams] = useSearchParams()
	const location = useLocation()
	const submit = useSubmit()
	const isSubmitting = useIsPending({
		formMethod: 'GET',
		formAction: '/users',
	})

	const handleFormChange = useDebounce((form: HTMLFormElement) => {
		submit(form)
	}, 400)

	return (
		<Form
			method="GET"
			action={location.pathname}
			className="flex flex-wrap items-center justify-center gap-2"
			onChange={(e) => autoSubmit && handleFormChange(e.currentTarget)}
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
					autoFocus={autoFocus}
				/>
			</div>
			<div>
				<StatusButton
					type="submit"
					status={isSubmitting ? 'pending' : status}
					className="flex w-full items-center justify-center"
					isIcon
				>
					<Button.Icon type="only">
						<Icon name="magnifying-glass" size="md" />
					</Button.Icon>
				</StatusButton>
			</div>
		</Form>
	)
}
