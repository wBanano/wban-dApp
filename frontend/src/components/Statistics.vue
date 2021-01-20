<template>
	<q-card class="my-card bg-primary text-black">
		<q-card-section>
			<div class="text-h6">wBAN Statistics</div>
			<div class="text-subtitle2">by Benis</div>
		</q-card-section>
		<q-card-section>
			<p><strong>Total Supply:</strong> {{ totalSupply | bnToString }} wBAN</p>
		</q-card-section>
	</q-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { bnToStringFilter } from '@/utils/filters.ts'
import contracts from '@/store/modules/contracts'
// import { BigNumber } from 'ethers'

@Component({
	filters: {
		bnToStringFilter
	}
})
export default class Statistics extends Vue {
	/*
	@contracts.totalSupply
	totalSupply!: BigNumber
	*/

	get totalSupply() {
		return contracts.totalSupply
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.q-card-section
	background-color: $primary
</style>
