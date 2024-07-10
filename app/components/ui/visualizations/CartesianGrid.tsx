import { CartesianGrid, CartesianGridProps } from 'recharts'
import { cartesianGrid } from '@tailus/themer'

export type GridProps = CartesianGridProps
export function Grid({ className, ...props }: GridProps) {
	return (
		<CartesianGrid
			id="Grid"
			className={cartesianGrid({
				className,
			})}
			stroke="currentColor"
			{...props}
		/>
	)
}
