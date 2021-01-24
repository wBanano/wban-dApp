import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import store from '@/store'
import axios from 'axios'

@Module({
	namespaced: true,
	name: 'backend',
	store,
	dynamic: true
})
class BackendModule extends VuexModule {
	private _online = false

	get online() {
		return this._online
	}

	@Mutation
	setOnline(online: boolean) {
		this._online = online
	}

	@Action
	async initBackend() {
		try {
			const r = await axios.request({ url: 'http://localhost:3000/health' })
			const status = r.data.status
			this.context.commit('setOnline', status === 'OK')
		} catch (err) {
			console.error(err)
			this.context.commit('setOnline', false)
		}
	}
}

export default getModule(BackendModule)
