<template>
	<q-card class="token-chooser-card flat bg-token-chooser text-black">
		<q-item>
			<q-item-section>
				<q-item-label>{{ label }}</q-item-label>
			</q-item-section>
			<q-item-section class="text-right">
				<q-item-label>Balance: {{ balance | bnToString }} {{ currency }}</q-item-label>
			</q-item-section>
		</q-item>
		<q-card-section>
			<q-input rounded dense outlined v-model.number="syncedAmount">
				<template v-slot:append>
					<a v-if="editable" @click="setToMax" class="max">Max</a>
					<img :src="require(`@/assets/${logoUrl}`)" class="currency-logo" />
				</template>
			</q-input>
		</q-card-section>
	</q-card>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator'
import { ethers, BigNumber } from 'ethers'
import { bnToStringFilter } from '@/utils/filters.ts'

@Component({
	filters: {
		bnToStringFilter
	}
})
export default class SwapCurrencyInput extends Vue {
	@Prop({ type: String, required: true }) readonly label!: string
	@Prop({ type: String, required: true }) readonly currency!: string
	@Prop({ type: Object, required: true }) balance!: BigNumber
	@Prop({ type: Boolean, required: false }) readonly editable!: boolean
	@PropSync('amount', { type: String }) syncedAmount!: string

	get logoUrl() {
		if (this.currency === 'BAN') {
			return 'ban-logo.png'
		} else {
			return 'wban-logo.png'
		}
	}

	setToMax() {
		this.syncedAmount = ethers.utils.formatUnits(this.balance, 18)
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.bg-token-chooser
	background-color: rgb(238, 234, 244) !important
	//background-color: lighten($secondary, 70%)
.max
	font-size: 0.7em
	text-decoration: underline
</style>
