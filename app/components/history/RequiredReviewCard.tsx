import { useUser } from '#app/utils/user.js'
import { useFetcher } from '@remix-run/react'
import Banner from '../ui/banner'
import Card from '../ui/card'
import { Icon } from '../ui/icon'
import { StatusButton } from '../ui/status-button'
import { Caption, Title } from '../ui/typography'
import { Link } from '../ui/typography/link'
import Button from '../ui/button'
import Label from '../ui/typography/label'
import Checkbox from '../checkbox'
import Aligner from '../ui/aligner'
import { useState } from 'react'

type RequireReviewCardProps = {
	total: number
}
function RequireReviewCard({ total }: RequireReviewCardProps) {
	const user = useUser()
	const fetcher = useFetcher()
	const [show, setShow] = useState(true)
	return (
		show && (
			<Banner.Root intent="danger" className="relative">
				<Banner.Content>
					<Banner.Icon>
						<Icon name="alert-square-rounded" />
					</Banner.Icon>
					<div className="">
						<Title>Action Required</Title>
						<Caption>
							You have <b>{total}</b> transactions that need review,{' '}
							<Link
								href={`/history?needReview=false&reviewer=${user.username}`}
								size="sm"
							>
								review now
							</Link>
						</Caption>
					</div>
					<fetcher.Form
						method="POST"
						action="/settings/profile/preferences"
						className="absolute bottom-0 right-0 top-0 flex flex-col items-end justify-between p-4"
					>
						<Button.Root
							size="xs"
							intent="danger"
							variant="ghost"
							type="submit"
							// onClick={() => {
							// 	setShow(false)
							// }}
						>
							<Button.Icon type="only">
								<Icon name="x" />
							</Button.Icon>
						</Button.Root>
						<Aligner>
							<Label>Don't show this banner again</Label>
							<Checkbox intent="primary" name="history.showNeedReviewBanner" />
						</Aligner>
					</fetcher.Form>
				</Banner.Content>
			</Banner.Root>
		)
	)
}

export default RequireReviewCard
