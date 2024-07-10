import {
	type TabsListProps as ListProps,
	type TabsIndicatorProps as IndicatorProps,
} from '@tailus/themer'
import { useEffect, useRef, useState } from 'react'
import Tabs from './ui/tabs'

type TabsAppProps = 'all' | 'unread' | 'archived'

interface TabsUIProps extends ListProps {
	indicatorVariant?: IndicatorProps['variant']
}
type TabsData = {
	trigger: {
		value: string
		id: string
	}
	content: {
		value: string
		render: React.ReactNode
		className?: string
	}
}
type TabSectionsProps = {
	data: TabsData[]
}
export const TabSections = ({ data }: TabSectionsProps) => {
	const [state, setState] = useState(data[0]?.trigger.value)
	const spanRef = useRef<HTMLSpanElement>(null)

	useEffect(() => {
		if (!spanRef.current) return
		if (!state) return
		const activeTrigger = document.getElementById(state) as HTMLElement
		if (spanRef.current && activeTrigger) {
			spanRef.current.style.left = (activeTrigger.offsetLeft || 0) + 'px'
			spanRef.current.style.width = (activeTrigger.offsetWidth || 0) + 'px'
		}
	}, [state])

	return (
		<Tabs.Root
			className="space-y-4"
			defaultValue={state}
			onValueChange={(value) => setState(value)}
		>
			<Tabs.List size="md">
				{data.map((tab) => (
					<Tabs.Trigger
						key={tab.trigger.id}
						value={tab.trigger.value}
						id={tab.trigger.id}
					>
						{tab.trigger.value}
					</Tabs.Trigger>
				))}
				<Tabs.Indicator
					ref={spanRef}
					variant="elevated"
					className="bg-primary-500/20"
				/>
			</Tabs.List>

			{data.map((tab) => (
				<Tabs.Content key={tab.trigger.id} value={tab.trigger.value}>
					{tab.content.render}
				</Tabs.Content>
			))}
		</Tabs.Root>
	)
}
