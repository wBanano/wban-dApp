import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import store from '@/store'
import Plausible from 'plausible-tracker'

@Module({
	namespaced: true,
	name: 'plausible',
	store,
	dynamic: true,
})
class PlausibleModule extends VuexModule {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _trackEvent: any
	private _initialized = false

	get trackEvent() {
		return this._trackEvent
	}

	@Mutation
	setTrackEvent(trackEvent: string) {
		this._trackEvent = trackEvent
		this._initialized = true
	}

	@Action
	init() {
		if (!this._initialized) {
			const { enableAutoPageviews, enableAutoOutboundTracking, trackEvent } = Plausible({
				domain: 'wrap.banano.cc',
				apiHost: 'https://plausible.banano.cc',
			})
			enableAutoPageviews()
			enableAutoOutboundTracking()
			this.context.commit('setTrackEvent', trackEvent)
		}
	}
}

export default getModule(PlausibleModule)
