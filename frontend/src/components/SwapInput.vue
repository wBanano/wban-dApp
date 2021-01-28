<template>
	<div class="q-pa-md q-gutter-sm">
		<swap-currency-input label="From" :amount.sync="amount" :balance="banBalance" currency="BAN" editable />
		<div class="text-center">
			<q-icon name="arrow_circle_down" class="arrow-down text-center" />
		</div>
		<swap-currency-input label="To" :amount.sync="amount" :balance="wBanBalance" currency="wBAN" />
		<div class="text-right">
			<q-btn label="Swap" @click="swap" :disable="!swapEnabled" color="primary" text-color="text-black" />
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import SwapCurrencyInput from '@/components/SwapCurrencyInput.vue'
import { BigNumber } from 'ethers'
import accounts from '@/store/modules/accounts'
import ban from '@/store/modules/ban'
import backend from '@/store/modules/backend'

@Component({
	components: {
		SwapCurrencyInput
	}
})
export default class SwapInput extends Vue {
	@Prop({ type: Object, required: true }) banBalance!: BigNumber
	@Prop({ type: Object, required: true }) wBanBalance!: BigNumber
	amount = ''

	get swapEnabled() {
		return this.amount !== '' && this.amount !== '0.0'
	}

	async swap() {
		if (accounts.activeAccount) {
			console.info('before swap')
			await backend.swap({
				amount: this.amount,
				banAddress: ban.banAddress,
				bscAddress: accounts.activeAccount,
				provider: accounts.providerEthers
			})
		}
	}
}
</script>

<style lang="sass" scoped>
.arrow-down
	font-size: 32px
	text-align: center
</style>
