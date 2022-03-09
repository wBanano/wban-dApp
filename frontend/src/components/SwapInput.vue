<template>
	<form @submit.prevent.stop="swap">
		<div class="q-pa-md q-gutter-sm">
			<div class="column items-end">
				<div class="col">
					<q-btn to="/history" flat icon="history" label="History" color="primary" size="md">
						<q-tooltip>History: see your past transactions and claim previously rejected transactions</q-tooltip>
					</q-btn>
				</div>
			</div>
			<swap-currency-input
				ref="from"
				label="From"
				:amount.sync="amount"
				:balance="fromBalance"
				:currency="fromCurrency"
				editable
			/>
			<div id="swap-icon" class="text-center">
				<q-icon @click="switchCurrencyInputs" name="swap_vert" class="cursor-pointer arrow-down text-center" />
			</div>
			<swap-currency-input ref="to" label="To" :amount="amount" :balance="toBalance" :currency="toCurrency" />
			<div class="text-right">
				<q-btn :label="swapLabel" type="submit" :disable="!swapEnabled" color="primary" text-color="text-black" />
			</div>
		</div>
	</form>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import SwapCurrencyInput from '@/components/SwapCurrencyInput.vue'
import { ethers, BigNumber } from 'ethers'
import accounts from '@/store/modules/accounts'
import ban from '@/store/modules/ban'
import backend from '@/store/modules/backend'
import contracts from '@/store/modules/contracts'
import { WBANToken } from '../../../artifacts/typechain'
import Dialogs from '@/utils/Dialogs'
import { Network } from '@/utils/Networks'

const banStore = namespace('ban')
const accountsStore = namespace('accounts')

@Component({
	components: {
		SwapCurrencyInput,
	},
})
export default class SwapInput extends Vue {
	@Prop({ type: Object, required: true }) banBalance!: BigNumber
	@Prop({ type: Object, required: true }) wBanBalance!: BigNumber
	@Ref('from') readonly fromInput!: SwapCurrencyInput
	@Ref('to') readonly toInput!: SwapCurrencyInput

	fromCurrency = ''
	toCurrency = ''

	@banStore.Getter('banAddress')
	banAddress!: string

	@accountsStore.Getter('activeCryptoBalance')
	cryptoBalance!: string

	@accountsStore.State('network')
	network!: Network

	amount = ''
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

	get swapLabel() {
		if (this.toCurrency === 'BAN') {
			return 'Unwrap'
		} else {
			return 'Wrap'
		}
	}

	get swapEnabled() {
		return (
			this.amount &&
			Number.parseFloat(this.amount) > 0 &&
			this.fromBalance.gte(ethers.utils.parseEther(this.amount)) &&
			!this.swapInProgress
		)
	}

	switchCurrencyInputs() {
		const tempCurrency: string = this.toCurrency
		this.toCurrency = this.fromCurrency
		this.fromCurrency = tempCurrency
		this.resetValidation()
	}

	resetValidation() {
		this.fromInput.resetValidation()
		this.toInput.resetValidation()
	}

	async swap() {
		if (!this.fromInput.validate()) {
			return
		}

		// check that the user as at sufficient crypto available for wrapping costs
		console.debug(`Required crypto balance: ${this.network.minimumNeededForWrap} ${this.network.nativeCurrency.symbol}`)
		if (this.fromCurrency === 'BAN' && Number.parseFloat(this.cryptoBalance) < this.network.minimumNeededForWrap) {
			Dialogs.showGasNeededError(Number.parseFloat(this.cryptoBalance))
			return
		} else {
			console.info(`Crypto balance is: ${this.cryptoBalance} ${this.network.nativeCurrency.symbol}`)
		}

		// warn use if wrapping/unwrapping less than 100 BAN/wBAN
		if (Number.parseFloat(this.amount) <= 100) {
			const proceed = await Dialogs.showLowAmountToWrapWarning(Number.parseFloat(this.amount))
			if (!proceed) {
				return
			}
		}

		if (accounts.activeAccount && this.amount) {
			this.swapInProgress = true
			if (this.fromCurrency === 'BAN') {
				await backend.swap({
					amount: Number.parseFloat(this.amount),
					banAddress: ban.banAddress,
					blockchainAddress: accounts.activeAccount,
					provider: accounts.providerEthers,
				})
			} else {
				const contract: WBANToken | null = contracts.wbanContract
				if (contract) {
					console.info(`Swap from wBAN to BAN requested for ${this.amount} BAN to ${this.banAddress}`)
					await contracts.swap({
						amount: ethers.utils.parseEther(this.amount),
						toBanAddress: this.banAddress,
						contract,
					})
				}
			}
			this.$emit('swap')
			this.amount = ''
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
@import '@/styles/quasar.sass'

.arrow-down
	font-size: 32px
	text-align: center

body.body--dark #swap-icon
	color: $primary
</style>
