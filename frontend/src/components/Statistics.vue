<template>
	<q-card class="statistics-card">
		<q-card-section>
			<div class="text-h6">wBAN Statistics</div>
			<div class="text-subtitle2">by Benis</div>
		</q-card-section>
		<q-card-section>
			<p><strong>Total Supply:</strong> {{ totalSupply | bnToHumanString }} wBAN</p>
		</q-card-section>
	</q-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { bnToStringFilter } from '@/utils/filters.ts'
import { BigNumber } from 'ethers'

const contractsStore = namespace('contracts')

@Component({
	filters: {
		bnToStringFilter
	}
})
export default class Statistics extends Vue {
	@contractsStore.Getter('totalSupply')
	totalSupply!: BigNumber
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.statistics-card
	background-image: url('../../public/bg-hero.svg') !important
	background-size: cover !important
</style>
