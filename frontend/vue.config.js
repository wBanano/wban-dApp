process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
	pages: {
		index: {
			entry: 'src/main.ts',
			title: process.env.VUE_APP_TITLE,
		},
	},
	pluginOptions: {
		quasar: {
			importStrategy: 'kebab',
			rtlSupport: false,
		},
		i18n: {
			locale: 'en',
			fallbackLocale: 'en',
			localeDir: 'locales',
			enableInSFC: false,
		},
	},
	configureWebpack: {
		module: {
			rules: [
				{ test: /node_modules[\\/]@walletconnect/, loader: 'babel-loader' },
				{ test: /node_modules[\\/]@metamask/, loader: 'babel-loader' },
			],
		},
	},
	devServer: {
		progress: process.env.NODE_ENV !== 'production',
	},
}
