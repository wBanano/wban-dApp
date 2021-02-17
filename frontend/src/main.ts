import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { Quasar, Notify } from 'quasar'
import './styles/quasar.sass'
import '@quasar/extras/material-icons/material-icons.css'

Vue.config.productionTip = false

Vue.use(Quasar, {
	plugins: {
		Notify
	}
})

new Vue({
	router,
	store,
	render: h => h(App)
}).$mount('#app')
