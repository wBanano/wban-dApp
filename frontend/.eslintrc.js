module.exports = {
	root: true,
	env: {
		node: true
	},
	extends: [
		'plugin:vue/essential',
		'eslint:recommended',
		'@vue/typescript/recommended',
		'@vue/prettier',
		'@vue/prettier/@typescript-eslint'
	],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: "module",
	},
	rules: {
		// 'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'no-console': 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'@typescript-eslint/ban-ts-ignore': 'off',
	}
}
