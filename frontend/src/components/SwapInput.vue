<template>
	<div class="q-pa-md q-gutter-sm">
		<swap-currency-input label="From" :amount.sync="amount" :balance="banBalance" currency="BAN" editable />
		<div class="text-center">
			<q-icon name="arrow_circle_down" class="arrow-down text-center" />
		</div>
		<swap-currency-input label="To" :amount.sync="amount" :balance="wBanBalance" currency="wBAN" />
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
import { BigNumber } from 'ethers'
import accounts from '@/store/modules/accounts'
import ban from '@/store/modules/ban'
import backend from '@/store/modules/backend'

const accountsStore = namespace('accounts')

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

	@accountsStore.Getter('activeBalanceBnb')
	bnbDeposits!: number

	amount = 0
	swapInProgress = false

	get swapEnabled() {
		return this.amount > 0 && this.bnbDeposits > 0.002 && !this.swapInProgress
	}

	async swap() {
		if (accounts.activeAccount) {
			this.swapInProgress = true
			this.bar.start()
			await backend.swap({
				amount: this.amount,
				banAddress: ban.banAddress,
				bscAddress: accounts.activeAccount,
				provider: accounts.providerEthers
			})
			this.$emit('swap')
			this.bar.stop()
			this.swapInProgress = false
		}
	}
}
</script>

<style lang="sass" scoped>
.arrow-down
	font-size: 32px
	text-align: center
</style>
