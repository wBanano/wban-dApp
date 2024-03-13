import { mountFactory } from '@quasar/quasar-app-extension-testing-unit-jest'
import { createLocalVue, Wrapper } from '@vue/test-utils'
import Swaps from '@/components/Swaps.vue'
import Vuex from 'vuex'
import store from '@/store'
import nock from 'nock'
import axios from 'axios'
import { sleep } from '@/utils/AsyncUtils'
import { Vue } from 'vue-property-decorator'

describe('Swaps', () => {
	let factory: any
	const localVue = createLocalVue()
	localVue.use(Vuex)

	beforeAll(async () => {
		const tokenList = (
			await axios.get('https://unpkg.com/@sushiswap/default-token-list@23.16.0/build/sushiswap-default.tokenlist.json')
		).data
		nock('http://localhost:3000')
			.defaultReplyHeaders({
				'access-control-allow-origin': '*',
				'access-control-allow-credentials': 'true',
			})
			.get('/dex/tokens')
			.reply(200, tokenList)
	})

	beforeEach(() => {
		factory = mountFactory(Swaps, {
			mount: {
				localVue,
				store: store,
				type: 'full',
			},
		})
	})

	it('should display by default a swap wBAN->USDC', async () => {
		const wrapper: Wrapper<Swaps> = factory()
		await sleep(1_000)
		expect(wrapper.is(Swaps)).toBeTruthy()
		//console.debug(wrapper.text())
		const from = wrapper.findComponent({ ref: 'from' })
		const to = wrapper.findComponent({ ref: 'to' })
		expect(from).toBeTruthy()
		expect(to).toBeTruthy()
		// expect a wBAN balance with 0 decimals
		expect(from.text()).toContain('Balance: 0.000 wBAN')
		// expect a WETH balance with 8 decimals
		expect(to.text()).toContain('Balance: 0.00000000 USDC')
		// expect empty input amount
		expect(wrapper.vm.$data.from.amount).toBe('')
		expect(wrapper.vm.$data.from.token.symbol).toBe('wBAN')
		// expect an empty string for estimated fee
		//expect(wrapper.vm.$data.estimatedFee).toBe('')
		// expect swap button to be disabled
		expect(wrapper.vm.$data.swapEnabled).toBeFalsy()
		expect(wrapper.find('#btn-swap').element).toHaveProperty('disabled')
	})

	/*
	it('should display an error when having a 0 input amount', async () => {
		const wrapper: Wrapper<Swaps> = factory()
		await sleep(1_000)
		expect(wrapper.is(Swaps)).toBeTruthy()

		// change input amount to 0
		const fromField = wrapper.findComponent({ ref: 'from' }).find('input[type="text"]')
		await fromField.setValue('0')
		//expect((fromField.element as any).value).toBe('0')
		const from = wrapper.find('input[type="text"]')
		await from.setValue('0')
		await Vue.nextTick()

		//console.debug('VM:', wrapper.vm.$data.from.amount)
		//expect(wrapper.vm.$data.from.amount).toBe('0')

		//console.debug(wrapper.findComponent({ ref: 'from' }).find('input[type=text]').element)
		//sleep(1_000)
		//expect(wrapper.vm.$data.swapLabel).toBe('Amount should be more than zero')
		sleep(5000)
		expect(wrapper.find('#btn-swap').text()).toBe('Amount should be more than zero')
  })
	*/
})
