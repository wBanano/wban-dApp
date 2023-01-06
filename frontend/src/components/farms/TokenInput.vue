<template>
	<q-card class="token-chooser-card flat bg-token-chooser text-black">
		<q-item>
			<q-item-section>
				<q-item-label v-if="!dense">{{ label }}</q-item-label>
			</q-item-section>
			<q-item-section side>
				<q-item-label>
					{{ $t('components.token-input.balance') }} {{ balance | bnToExactString(decimals) }}
				</q-item-label>
			</q-item-section>
		</q-item>
		<q-card-section>
			<div class="row q-col-gutter-md">
				<span v-if="$slots.prepend" class="prepend col-5"><slot name="prepend" /></span>
				<q-input
					ref="amount"
					class="col"
					rounded
					dense
					outlined
					:disable="!editable"
					v-model="syncAmount"
					@input="emitEvent"
					:rules="validationRules"
				>
					<template v-slot:append v-if="!dense">
						<a v-if="editable" @click="setToMax" class="max">{{ $t('components.token-input.max') }}</a>
					</template>
				</q-input>
				<span v-if="$slots.append" class="prepend col-12"><slot name="append" /></span>
			</div>
		</q-card-section>
	</q-card>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator'
import { BigNumber } from 'ethers'
import { bnToExactStringFilter, banPriceFilter } from '@/utils/filters'
import accounts from '@/store/modules/accounts'
import { formatUnits, parseUnits } from 'ethers/lib/utils'

@Component({
	filters: {
		bnToExactStringFilter,
		banPriceFilter,
	},
})
export default class TokenInput extends Vue {
	@Prop({ type: String, required: true }) readonly label!: string
	@Prop({ type: String, required: true }) readonly currency!: string
	@Prop({ type: Object, required: true }) readonly balance!: BigNumber
	@Prop({ type: Number, required: false }) readonly decimals!: number
	@Prop({ type: Boolean, required: false }) readonly editable!: boolean
	@Prop({ type: Boolean, required: false, default: false }) readonly dense!: boolean
	@PropSync('amount', { type: String, required: true }) syncAmount!: string

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	@Ref('amount') readonly amountField!: any

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	validationRules: Array<any> = [
		(val: string) => val === '' || Number.parseFloat(val) > 0 || 'Amount should be more than zero',
		(val: string) => this.isLowerThanMax(val) || 'Not enough available!',
	]

	setToMax() {
		this.syncAmount = formatUnits(this.balance, this.decimals)
	}

	isLowerThanMax(val: string) {
		if (val == '') {
			return true
		} else {
			return !this.editable || parseUnits(val, this.decimals).lte(this.balance)
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
	color: $primary
	font-size: 0.7em
	text-decoration: underline
</style>
