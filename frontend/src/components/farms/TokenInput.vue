<template>
	<q-card class="token-chooser-card flat bg-token-chooser text-black">
		<q-item>
			<q-item-section>
				<q-item-label>{{ label }}</q-item-label>
			</q-item-section>
			<q-item-section side>
				<q-item-label>Balance: {{ balance | bnToExactString }}</q-item-label>
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
				</template>
			</q-input>
		</q-card-section>
	</q-card>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator'
import { BigNumber, ethers } from 'ethers'
import { bnToExactStringFilter, banPriceFilter } from '@/utils/filters'
import accounts from '@/store/modules/accounts'

@Component({
	filters: {
		bnToExactStringFilter,
		banPriceFilter
	}
})
export default class TokenInput extends Vue {
	@Prop({ type: String, required: true }) readonly label!: string
	@Prop({ type: String, required: true }) readonly currency!: string
	@Prop({ type: Object, required: true }) readonly balance!: BigNumber
	@Prop({ type: Boolean, required: false }) readonly editable!: boolean
	@PropSync('amount', { type: String, required: true }) syncAmount!: string

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	@Ref('amount') readonly amountField!: any

	validationRules: Array<Function> = [
		(val: string) => val == '' || Number.parseFloat(val) > 0 || 'Amount should be more than zero',
		(val: string) => this.isLowerThanMax(val) || `Not enough ${this.currency} available!`
	]

	setToMax() {
		this.syncAmount = ethers.utils.formatEther(this.balance)
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

<style lang="sass" scoped>
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
</style>
