const path = require('path')
const synpressPath = path.join(process.cwd(), '/node_modules/@synthetixio/synpress')

module.exports = {
	root: true,
	env: {
		browser: true,
		es2021: true,
	},
	extends: [
		'plugin:vue/essential',
		'eslint:recommended',
		'@vue/typescript/recommended',
		'@vue/prettier',
		//'@vue/prettier/@typescript-eslint',
		`${synpressPath}/.eslintrc.js`,
	],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	rules: {
		// 'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'no-console': 'off',
		'no-debugger': process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'polygon' ? 'warn' : 'off',
		'@typescript-eslint/ban-ts-ignore': 'off',
		'@typescript-eslint/no-loss-of-precision': 'off',
		'@typescript-eslint/ban-ts-comment': 'off',
		'import/no-unresolved': 'error',
	},
	settings: {
		'import/parsers': {
			'@typescript-eslint/parser': ['.ts', '.tsx'],
		},
		'import/resolver': {
			typescript: {
				alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
			},
		},
	},
}
