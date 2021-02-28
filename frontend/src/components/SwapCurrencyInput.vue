<template>
	<q-card class="token-chooser-card flat bg-token-chooser text-black">
		<q-item>
			<q-item-section>
				<q-item-label>{{ label }}</q-item-label>
			</q-item-section>
			<q-item-section class="col-8 text-right">
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
		<q-card-actions vertical align="right" v-if="currency === 'wBAN'">
			<a id="add-wban-to-metamask" @click="addWBANToMetaMask">
				Add wBAN to MetaMask
				<q-icon name="img:metamask.svg" size="24px" />
			</a>
		</q-card-actions>
	</q-card>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator'
import { BigNumber } from 'ethers'
import { bnToStringFilter } from '@/utils/filters'

import accounts from '@/store/modules/accounts'

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
	@PropSync('amount', { type: Number }) syncedAmount!: number

	get logoUrl() {
		if (this.currency === 'BAN') {
			return 'ban-logo.png'
		} else {
			return 'wban-logo.svg'
		}
	}

	setToMax() {
		this.syncedAmount = this.balance
			.div(1_000_000_000_000_000)
			.div(1_000)
			.toNumber()
	}

	addWBANToMetaMask() {
		accounts.addWBANTokenToMetaMask()
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
