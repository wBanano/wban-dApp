import { mountQuasar } from '@quasar/quasar-app-extension-testing-unit-jest'
import { Wrapper } from '@vue/test-utils'
import TokenChooser from '@/components/tokens/TokenChooser.vue'
import { QAvatar, QIcon, QItem } from 'quasar'
import { Token } from '@/config/constants/dex'

describe('TokenChooser', () => {
	let wrapper: Wrapper<any>
	const token: Token = {
		name: 'Wrapped Banano',
		symbol: 'wBAN',
		address: '',
		logoURI: '',
		decimals: 18,
		chainId: 0,
	}

	beforeEach(() => {
		wrapper = mountQuasar(TokenChooser, {
			quasar: {
				components: {
					QItem,
					QAvatar,
					QIcon,
				},
			},
			propsData: {
				value: token,
			},
		})
	})

	it('expects something', async () => {
		expect(wrapper).toBeTruthy()
		expect(wrapper.find('span.symbol').text()).toMatch('wBAN')
		// console.debug(wrapper.find('.token-display'))
		// await wrapper.find('.token-display').trigger('click')
		// await sleep(1_000)
		// console.debug(wrapper.text())
		//expect(wrapper.text()).toContain('Select a token')
	})
})
