import { components, palette, palettes, rounded, shade } from '@tailus/themer'
import { type Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'
import radixPlugin from 'tailwindcss-radix'

export default {
	content: [
		'./app/**/*.{ts,tsx,jsx,js}',
		'./node_modules/@tailus/themer/dist/components/**/*.{js,ts}',
	],
	darkMode: 'class',
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: palettes.trust,
		},
		// extend: extendedTheme,
	},
	// presets: [marketingPreset],
	plugins: [rounded, shade, components, animatePlugin, radixPlugin, palette],
} satisfies Config
