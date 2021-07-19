process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
	pages: {
		index: {
			entry: 'src/main.ts',
			title: 'wBAN - Wrapped Banano on Binance Smart Chain'
		}
	},
	pluginOptions: {
		quasar: {
			importStrategy: 'kebab',
			rtlSupport: false
		},
		apollo: {
			lintGQL: true
		}
	}
	/*
	transpileDependencies: ['quasar'],
	devServer: {
    disableHostCheck: true
  }
	*/
}
