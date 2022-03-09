<template>
	<q-card class="token-chooser-card flat bg-token-chooser text-black">
		<q-item>
			<q-item-section>
				<q-item-label>{{ label }}</q-item-label>
			</q-item-section>
			<q-item-section class="col-8 text-right">
				<q-item-label>
					Balance: {{ balance | bnToString }} {{ currency }} ({{ balance | bnToString | banPrice }})
				</q-item-label>
			</q-item-section>
		</q-item>
		<q-card-section>
			<q-input
				ref="amount"
				rounded
				dense
				outlined
				:disable="!editable"
				v-model="syncAmount"
				@input="emitEvent"
				:rules="validationRules"
			>
				<template v-slot:append>
					<a v-if="editable" @click="setToMax" class="max">Max</a>
					<img :src="require(`@/assets/${logoUrl}`)" class="currency-logo" />
				</template>
			</q-input>
		</q-card-section>
		<q-card-actions vertical align="right" v-if="currency === 'wBAN'">
			<a id="add-wban-to-metamask" @click="addWBANToMetaMask">
				Add wBAN to MetaMask
				<q-icon name="img:metamask.svg" size="24px" />
			</a>
		</q-card-actions>
	</q-card>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { BigNumber, ethers } from 'ethers'
import { bnToStringFilter, banPriceFilter } from '@/utils/filters'
import accounts from '@/store/modules/accounts'
import { Network } from '@/utils/Networks'

const accountsStore = namespace('accounts')

@Component({
	filters: {
		bnToStringFilter,
		banPriceFilter,
	},
})
export default class SwapCurrencyInput extends Vue {
	@Prop({ type: String, required: true }) readonly label!: string
	@Prop({ type: String, required: true }) readonly currency!: string
	@Prop({ type: Object, required: true }) readonly balance!: BigNumber
	@Prop({ type: Boolean, required: false }) readonly editable!: boolean
	@PropSync('amount', { type: String, required: true }) syncAmount!: string

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	@Ref('amount') readonly amountField!: any

	@accountsStore.State('network')
	network!: Network

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	validationRules: Array<any> = [
		(val: string) => val == '' || Number.parseFloat(val) > 0 || 'Amount should be more than zero',
		(val: string) => this.hasNoMoreThanTwoDecimals(val) || 'No more than 2 decimals',
		(val: string) => this.isLowerThanMax(val) || `Not enough ${this.currency} available!`,
	]

	get logoUrl() {
		if (this.currency === 'BAN') {
			return 'ban-logo.png'
		} else {
			return `wban-logo-${this.network.network}.svg`
		}
	}

	setToMax() {
		const rawAmount = Number.parseFloat(ethers.utils.formatEther(this.balance))
		this.syncAmount = (Math.floor(rawAmount * 100) / 100).toString()
	}

	hasNoMoreThanTwoDecimals(val: string) {
		if (val === '' || !this.editable) {
			return true
		}
		const number = Number.parseFloat(val)
		const rounded = Math.round(number * 100) / 100
		return number == rounded
	}

	isLowerThanMax(val: string) {
		if (val == '') {
			return true
		} else {
			return !this.editable || ethers.utils.parseEther(val).lte(this.balance)
		}
	}

	addWBANToMetaMask() {
		accounts.addWBANTokenToMetaMask()
	}

	emitEvent(event: string) {
		if (this.editable) {
			this.$emit('update:amount', event)
		}
	}

	public validate(): boolean {
		if (this.editable) {
			this.amountField.validate()
			return !this.amountField.hasError
		} else {
			return true
		}
	}

	public resetValidation() {
		this.amountField.resetValidation()
	}
}
</script>

<style lang="sass">
@import '@/styles/quasar.sass'

body.body--light .bg-token-chooser
	background-color: lighten($secondary, 75%) !important
body.body--dark .bg-token-chooser
	background-color: lighten($secondary, 10%) !important
body.body--dark #add-wban-to-metamask
	color: $primary
	cursor: pointer
	font-size: .8em
.max
	font-size: 0.7em
	text-decoration: underline
.q-field--disabled .q-field__control > div.q-field__append
	opacity: 1 !important
</style>
