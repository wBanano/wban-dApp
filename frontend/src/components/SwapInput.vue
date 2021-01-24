<template>
	<div class="q-pa-md q-gutter-sm">
		<q-banner v-if="inError" inline-actions class="text-white bg-error">
			{{ errorMessage }}
			<template v-slot:action>
				<q-btn flat color="white" label="Retry" @click="swap" />
			</template>
		</q-banner>
		<swap-currency-input label="From" :amount.sync="amount" :balance="banBalance" currency="BAN" editable />
		<div class="text-center">
			<q-icon name="arrow_circle_down" class="arrow-down text-center" />
		</div>
		<swap-currency-input label="To" :amount.sync="amount" :balance="wBanBalance" currency="wBAN" />
		<div class="text-right">
			<q-btn label="Swap" @click="swap" :disable="amount === ''" color="primary" text-color="text-black" />
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import SwapCurrencyInput from '@/components/SwapCurrencyInput.vue'
import { BigNumber } from 'ethers'
import axios from 'axios'
import accounts from '@/store/modules/accounts'
import ban from '@/store/modules/ban'

@Component({
	components: {
		SwapCurrencyInput
	}
})
export default class SwapInput extends Vue {
	@Prop({ type: Object, required: true }) banBalance!: BigNumber
	@Prop({ type: Object, required: true }) wBanBalance!: BigNumber
	amount = ''
	inError = false
	errorMessage = ''

	async swap() {
		console.info(`Should swap ${this.amount} BAN to wBAN...`)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const provider: any = accounts.providerEthers
		if (provider && this.amount && accounts.activeAccount) {
			const sig = await provider
				.getSigner()
				.signMessage(`Swap ${this.amount} BAN for wBAN with BAN I deposited from my wallet "${ban.banAddress}"`)
			console.debug(sig)
			// call the backend for the swap
			try {
				const r = await axios.post(`http://localhost:3000/swap`, {
					ban: ban.banAddress,
					bsc: accounts.activeAccount,
					amount: this.amount,
					sig: sig
				})
				console.debug(r)
				this.inError = false
				this.errorMessage = ''
			} catch (err) {
				this.inError = true
				this.errorMessage = err
			}
		}
	}
}
</script>

<style lang="sass" scoped>
.arrow-down
	font-size: 32px
	text-align: center
.bg-error
	background-color: red
</style>
