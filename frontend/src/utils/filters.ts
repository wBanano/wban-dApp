import Vue from 'vue'
import { ethers } from 'ethers'

const bnToStringFilter = Vue.filter('bnToString', (value: string) => {
	return ethers.utils.formatUnits(value, 18)
})

const bscAddressFilter = Vue.filter('bscAddress', (address: string) => {
	return address
		.substring(0, 8)
		.concat('...')
		.concat(address.substring(address.length - 6))
})

export { bnToStringFilter, bscAddressFilter }
