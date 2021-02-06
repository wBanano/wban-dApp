<template>
	<div class="q-pa-md q-gutter-sm">
		<swap-currency-input label="From" :amount.sync="amount" :balance="fromBalance" :currency="fromCurrency" editable />
		<div class="text-center">
			<q-icon @click="switchCurrencyInputs" name="swap_vert" class="cursor-pointer arrow-down text-center" />
		</div>
		<swap-currency-input label="To" :amount.sync="amount" :balance="toBalance" :currency="toCurrency" />
		<div class="text-right">
			<q-btn ref="btnSwap" label="Swap" @click="swap" :disable="!swapEnabled" color="primary" text-color="text-black" />
		</div>
		<q-ajax-bar ref="bar" position="bottom" color="primary" size="10px" skip-hijack />
	</div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { QBtn, QAjaxBar } from 'quasar'
import SwapCurrencyInput from '@/components/SwapCurrencyInput.vue'
import { ethers, BigNumber } from 'ethers'
import accounts from '@/store/modules/accounts'
import ban from '@/store/modules/ban'
import backend from '@/store/modules/backend'
import contracts from '@/store/modules/contracts'
import { WBANToken } from '../../../artifacts/typechain'

const banStore = namespace('ban')
const contractsStore = namespace('contracts')

@Component({
	components: {
		SwapCurrencyInput
	}
})
export default class SwapInput extends Vue {
	@Prop({ type: Object, required: true }) banBalance!: BigNumber
	@Prop({ type: Object, required: true }) wBanBalance!: BigNumber
	@Ref('btnSwap') readonly btnSwap!: QBtn
	@Ref('bar') readonly bar!: QAjaxBar

	fromCurrency = ''
	toCurrency = ''

	@banStore.Getter('banAddress')
	banAddress!: string

	@contractsStore.Getter('bnbDeposits')
	bnbDeposits!: BigNumber

	amount = 0
	swapInProgress = false

	get fromBalance() {
		if (this.fromCurrency === 'BAN') {
			return this.banBalance
		} else {
			return this.wBanBalance
		}
	}

	get toBalance() {
		if (this.toCurrency === 'BAN') {
			return this.banBalance
		} else {
			return this.wBanBalance
		}
	}

	get swapEnabled() {
		return (
			this.amount > 0 &&
			this.fromBalance.gte(ethers.utils.parseEther(this.amount.toString())) &&
			this.bnbDeposits.gte(ethers.utils.parseEther('0.002')) &&
			!this.swapInProgress
		)
	}

	switchCurrencyInputs() {
		const tempCurrency: string = this.toCurrency
		this.toCurrency = this.fromCurrency
		this.fromCurrency = tempCurrency
	}

	async swap() {
		if (accounts.activeAccount) {
			this.swapInProgress = true
			this.bar.start()

			if (this.fromCurrency === 'BAN') {
				console.info('Swap from BAN to wBAN requested')
				await backend.swap({
					amount: this.amount,
					banAddress: ban.banAddress,
					bscAddress: accounts.activeAccount,
					provider: accounts.providerEthers
				})
			} else {
				const contract: WBANToken | null = contracts.wbanContract
				if (contract) {
					console.info(`Swap from wBAN to BAN requested for ${this.amount} BAN to ${this.banAddress}`)
					await contracts.swap({
						amount: ethers.utils.parseEther(this.amount.toString()),
						toBanAddress: this.banAddress,
						contract
					})
				}
			}
			this.$emit('swap')
			this.bar.stop()
			this.swapInProgress = false
		}
	}

	created() {
		this.fromCurrency = 'BAN'
		this.toCurrency = 'wBAN'
	}
}
</script>

<style lang="sass" scoped>
.arrow-down
	font-size: 32px
	text-align: center
</style>
