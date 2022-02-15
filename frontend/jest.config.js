const {
  compilerOptions
} = require('./tsconfig');

const {
  resolve
} = require('path');

module.exports = {
	globals: {
		__DEV__: true
	},
	setupFiles: [
		"fake-indexeddb/auto"
	],
	setupFilesAfterEnv: [
		'<rootDir>/tests/unit/jest.setup.ts'
	],
	preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
	collectCoverage: true,
	collectCoverageFrom: [
		'<rootDir>/src/**/*.vue',
		'<rootDir>/src/**/*.js',
		'<rootDir>/src/**/*.ts',
		'<rootDir>/src/**/*.jsx'
	],
	coverageThreshold: {
		global: {
			statements: 15.3,
			branches: 6.6,
			functions: 7.2,
			lines: 15.1,
		}
	},
	moduleFileExtensions: [
		'vue',
		'js',
		'jsx',
		'json',
		'ts',
		'tsx',
	],
	moduleNameMapper: {
		//"^vue$": "<rootDir>/node_modules/vue/dist/vue.esm.js",
		'^vue$': '<rootDir>/node_modules/vue/dist/vue.common.js',
		//'^test-utils$': '<rootDir>/node_modules/@vue/test-utils/dist/vue-test-utils.js',
		//'^quasar$': '<rootDir>/node_modules/quasar/dist/quasar.common.js',
		'^@/(.*)$': resolve(__dirname, './src/$1'),
		'^@artifacts/(.*)$': resolve(__dirname, '../artifacts/$1'),
	},
	transform: {
    '.*\\.vue$': 'vue-jest',
    '.*\\.js$': 'babel-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    // use these if NPM is being flaky
    // '.*\\.vue$': '<rootDir>/node_modules/@quasar/quasar-app-extension-testing-unit-jest/node_modules/vue-jest',
    // '.*\\.js$': '<rootDir>/node_modules/@quasar/quasar-app-extension-testing-unit-jest/node_modules/babel-jest'
  },
	/*
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!quasar/lang)'
  ],
	*/
  snapshotSerializers: [
    '<rootDir>/node_modules/jest-serializer-vue'
  ]
}
