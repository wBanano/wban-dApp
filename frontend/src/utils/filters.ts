import Vue from 'vue'
import { ethers } from 'ethers'
import numeral from 'numeral'
import { date } from 'quasar'
import ban from '@/store/modules/ban'

const bnToStringFilter = Vue.filter('bnToString', (value: string) => {
	if (value === '') {
		return ''
	} else {
		return numeral(ethers.utils.formatUnits(value, 18)).format('0,0[.]00000')
	}
})

const bnToZeroDecimalsStringFilter = Vue.filter('bnToZeroDecimalsString', (value: string) => {
	return numeral(ethers.utils.formatUnits(value, 18)).format('0,0')
})

const bnToTwoDecimalsStringFilter = Vue.filter('bnToTwoDecimalsString', (value: string) => {
	return numeral(ethers.utils.formatUnits(value, 18)).format('0,0[.]00')
})

const bnToSixDecimalsStringFilter = Vue.filter('bnToSixDecimalsString', (value: string) => {
	return numeral(ethers.utils.formatUnits(value, 18)).format('0,0[.]000000')
})

const bnToExactStringFilter = Vue.filter('bnToExactString', (value: string) => {
	return numeral(ethers.utils.formatUnits(value, 18)).format('0,0[.]00000000')
})

const bnToHumanStringFilter = Vue.filter('bnToHumanString', (value: string) => {
	return `~ ${numeral(ethers.utils.formatUnits(value, 18)).format('0,00 a')}`
})

const blockchainAddressFilter = Vue.filter('blockchainAddress', (address: string) => {
	return address
		.substring(0, 8)
		.concat('...')
		.concat(address.substring(address.length - 6))
})

const banPriceFilter = Vue.filter('banPrice', (_amount: string) => {
	const amount = numeral(_amount).value() || 0
	return numeral(amount * ban.banPriceInUSD).format('$0,0.00')
})

const timestampFilter = Vue.filter('timestamp', (timestamp: string) => {
	return date.formatDate(Number.parseInt(timestamp), 'YYYY-MM-DD HH:mm:ss')
})

const hashTrimmedFilter = Vue.filter('hash_trimmed', (hash: string) => {
	return hash
		.substring(0, 6)
		.concat('...')
		.concat(hash.substring(hash.length - 7, hash.length - 1))
})

export {
	bnToStringFilter,
	bnToZeroDecimalsStringFilter,
	bnToTwoDecimalsStringFilter,
	bnToSixDecimalsStringFilter,
	bnToExactStringFilter,
	bnToHumanStringFilter,
	blockchainAddressFilter,
	banPriceFilter,
	timestampFilter,
	hashTrimmedFilter,
}
