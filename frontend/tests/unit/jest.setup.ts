import * as All from 'quasar';
import { VueConstructor } from 'vue';
import { Vue } from 'vue-property-decorator'

// No console.log() / setTimeout
// console.log = jest.fn(() => { throw new Error('Do not use console.log() in production') })
// jest.setTimeout(5_000)

const { Quasar, Notify, Cookies, Dialog } = All

function isComponent(value: any): value is VueConstructor {
	return value && value.component && value.component.name != null
}

export const components = Object.keys(All).reduce<{ [index: string]: VueConstructor }>((object, key) => {
	const val = (All as any)[key]
	if (isComponent(val)) {
		object[key] = val
	}
	return object
}, {})

Vue.use(Quasar, { components, plugins: { Notify, Cookies, Dialog } })

Notify.create = () => {
	return jest.fn()
}
