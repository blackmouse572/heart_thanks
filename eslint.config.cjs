/** @type {import("eslint").Linter.Config} */
const config = [
	// add custom config objects here:
	...require('@epic-web/config/eslint').default,
	{
		plugins: {
			'react-hooks': require('plugin:react-hooks/recommended'),
		},
	},
]

module.exports = config
