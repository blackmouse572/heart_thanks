import { Caption } from '#app/components/ui/typography/caption.js'
import Card from '#app/components/ui/card.js'
import SeparatorRoot from '#app/components/ui/seperator.js'
import { Title } from '#app/components/ui/typography/title.js'
import { prisma } from '#app/utils/db.server.js'

import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData, useSearchParams } from '@remix-run/react'
import * as Link from '#app/components/ui/link.tsx'
import Label from '#app/components/ui/typography/label.js'
import Banner from '#app/components/ui/banner.js'
import { Icon } from '#app/components/ui/icon.js'
import { Text } from '#app/components/ui/typography/text.js'
import Aligner from '#app/components/ui/aligner.js'
import Switch from '#app/components/ui/toggle.tsx'
import Button from '#app/components/ui/button.js'
import Input from '#app/components/ui/input.js'
export async function loader({ request }: LoaderFunctionArgs) {
	const currentSettings = await prisma.applicationSetting.findMany()
	return json({
		currentSettings,
	})
}

function SettingPage() {
	const data = useLoaderData<typeof loader>()
	const [searchParams, setSearchParams] = useSearchParams()
	const selectedSetting = searchParams.get('p')
	const setting =
		data.currentSettings.find((setting) => setting.id === selectedSetting) ||
		data.currentSettings[0]

	if (!setting) {
		return <div>Setting not found</div>
	}
	return (
		<div className="container mt-5">
			<Card>
				<Title>Settings</Title>
				<Caption>Manage application settings</Caption>
				<SeparatorRoot className="mb-5 mt-2" />
				<div className="gap-5 divide-x divide-[--ui-border-color] lg:flex lg:[grid-template-columns:auto_1fr]">
					<aside className="min-w-[200px] pr-2">
						{data.currentSettings.map((setting) => {
							const isActive = selectedSetting === setting.id
							return (
								<Link.Root
									key={setting.id}
									link={`/admin/settings?p=${setting.id}`}
									isActive={isActive}
									intent={isActive ? 'secondary' : 'gray'}
									variant={isActive ? 'outlined' : 'ghost'}
								>
									<Link.Label>{setting.title}</Link.Label>
								</Link.Root>
							)
						})}
					</aside>
					<section className="w-full pl-5">
						<Title>{setting.title}</Title>
						<Caption>{setting.description}</Caption>
						{setting.isUsed && (
							<Banner.Root className="my-4">
								<Banner.Content>
									<Banner.Icon>
										<Icon name="check" />
									</Banner.Icon>
									<Text>This setting is currently enabled</Text>
								</Banner.Content>
							</Banner.Root>
						)}
						<div className="mt-4 space-y-8">
							<div>
								<Aligner fromRight className="">
									<Label>Allow Transfer</Label>
									<Switch.Root className="mt-1" id="airplane-mode">
										<Switch.Thumb />
									</Switch.Root>
									<Caption as="p" size="base">
										Allow user for transfer hearts. Please be careful with this
										setting.
									</Caption>
								</Aligner>
								{setting.averagePoints}
								<Aligner fromRight className="">
									<Label>Average points</Label>
									<Input />
									<Caption as="p" size="base">
										Each quater, user will get this amount of points
									</Caption>
								</Aligner>
							</div>
							<div>
								<Button.Root>
									<Button.Label>Save</Button.Label>
								</Button.Root>
							</div>
						</div>
					</section>
				</div>
			</Card>
		</div>
	)
}

export default SettingPage
