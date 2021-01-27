import Vue from 'vue'
import Vuex from 'vuex'
import { config } from 'vuex-module-decorators'

Vue.use(Vuex)

// Set rawError to true by default on all @Action decorators
config.rawError = true

export default new Vuex.Store({
	state: {},
	mutations: {},
	actions: {}
})
