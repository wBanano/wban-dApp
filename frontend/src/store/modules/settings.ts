import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import store from '@/store'
import { Dark } from 'quasar'

@Module({
	namespaced: true,
	name: 'settings',
	store,
	dynamic: true
})
class SettingsModule extends VuexModule {
	private _darkMode!: boolean

	get isDarkModeEnabled(): boolean {
		const localStorageValue = localStorage.getItem('darkMode')
		if (localStorageValue) {
			const darkModeEnabled: boolean = localStorageValue === 'true'
			Dark.set(darkModeEnabled)
			return darkModeEnabled
		}
		Dark.set(true)
		return true
	}

	@Mutation
	setDarkMode(enabled: boolean) {
		this._darkMode = enabled
		Dark.set(enabled)
		localStorage.setItem('darkMode', enabled.toString())
	}

	@Action
	async enableDarkMode(enabled: boolean) {
		console.log('in enableDarkMode')
		this.context.commit('setDarkMode', enabled)
	}
}

export default getModule(SettingsModule)
