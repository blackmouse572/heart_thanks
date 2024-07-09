import { type CheckboxProps } from './ui/checkbox.tsx'
import UICheckbox from './ui/checkbox'
import { Icon } from './ui/icon'

type CustomCheckboxProps = CheckboxProps & {
	indeterminate?: boolean
}

/**
 *
 * @param props
 * @param props.indeterminate Override the current state of the checkbox
 * @returns
 */
function Checkbox({ ...props }: CustomCheckboxProps) {
	const { indeterminate } = props
	const stateIcon = indeterminate ? 'minus' : 'check'
	return (
		<UICheckbox.Root {...props}>
			<UICheckbox.Indicator>
				<Icon name={stateIcon} className="size-3.5" strokeWidth={3} />
			</UICheckbox.Indicator>
		</UICheckbox.Root>
	)
}

export default Checkbox
