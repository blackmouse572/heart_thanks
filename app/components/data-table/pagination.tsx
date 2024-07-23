import { Metadata } from '#app/utils/request.server.js'
import { useSearchParams } from '@remix-run/react'
import { Pagination, PaginationContent, PaginationItem } from '../pagination'
import { usePagination } from '../pagination/usePagination'
import Button from '../ui/button'
import { useCallback } from 'react'
import { getCurrentPage } from '#app/utils/pagination.js'
import { Icon } from '../ui/icon'

type PaginationProps = {
	metadata: Metadata
}
function TablePagination({ metadata }: PaginationProps) {
	const { take, totals } = metadata
	const [searchParams, setSearchParams] = useSearchParams()
	const getPaginationHref = useCallback(
		(page: number) => {
			const newSearchParams = new URLSearchParams(searchParams)
			newSearchParams.set('skip', String(page * take - take))
			newSearchParams.set('take', String(take))

			setSearchParams(newSearchParams, {
				preventScrollReset: true,
			})
		},
		[searchParams],
	)
	const { items, isNextDisabled, isPreviousDisabled } = usePagination({
		currentPage: getCurrentPage(metadata),
		pageSize: take,
		onPageChange: getPaginationHref,
		totalCount: totals ?? 0,
		siblingCount: 1,
	})
	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem
					key={'prev'}
					onClick={() => {
						getPaginationHref(getCurrentPage(metadata) - 1)
					}}
				>
					<Button.Root
						isIcon
						size="sm"
						disabled={isPreviousDisabled}
						variant={'outlined'}
					>
						<Button.Icon type="only">
							<Icon name="chevron-left" />
						</Button.Icon>
					</Button.Root>
				</PaginationItem>
				{items.map((item, i) => (
					<PaginationItem
						key={item.value}
						aria-disabled={item.disabled}
						onClick={item.action}
					>
						{item.value === '...' ? (
							<Button.Root
								className="disabled:bg-transparent"
								intent="gray"
								variant="soft"
								disabled
							>
								<Button.Label>{item.value}</Button.Label>
							</Button.Root>
						) : (
							<Button.Root
								isIcon
								size="sm"
								disabled={item.disabled}
								variant={item.active ? 'solid' : 'ghost'}
							>
								<Button.Label>{item.value}</Button.Label>
							</Button.Root>
						)}
					</PaginationItem>
				))}

				<PaginationItem
					key={'next'}
					onClick={() => {
						getPaginationHref(getCurrentPage(metadata) + 1)
					}}
				>
					<Button.Root
						isIcon
						disabled={isNextDisabled}
						variant={'outlined'}
						size="sm"
					>
						<Button.Icon type="only">
							<Icon name="chevron-right" />
						</Button.Icon>
					</Button.Root>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	)
}

export default TablePagination
