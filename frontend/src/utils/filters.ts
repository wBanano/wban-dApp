import Vue from 'vue'
import { ethers } from 'ethers'
import numeral from 'numeral'

const bnToStringFilter = Vue.filter('bnToString', (value: string) => {
	return numeral(ethers.utils.formatUnits(value, 18)).format('0,0[.]00000')
})

const bnToHumanStringFilter = Vue.filter('bnToHumanString', (value: string) => {
	return `~ ${numeral(ethers.utils.formatUnits(value, 18)).format('0,00 a')}`
})

const bscAddressFilter = Vue.filter('bscAddress', (address: string) => {
	return address
		.substring(0, 8)
		.concat('...')
		.concat(address.substring(address.length - 6))
})

export { bnToStringFilter, bnToHumanStringFilter, bscAddressFilter }
