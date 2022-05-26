<template>
	<q-card class="statistics-card">
		<q-card-section>
			<div class="text-h6">{{ $t('components.statistics.title') }}</div>
			<div class="text-subtitle2">{{ $t('components.statistics.from') }}</div>
		</q-card-section>
		<q-card-section>
			<p>
				<strong>
					{{ $t('components.statistics.total-supply') }}
					<q-icon name="info" class="dictionary vertical-top">
						<q-tooltip>{{ $t('components.statistics.total-supply-tooltip') }}</q-tooltip>
					</q-icon>
					:
				</strong>
				{{ totalSupply | bnToHumanString }} wBAN ({{ totalSupply | bnToString | banPrice }})
			</p>
		</q-card-section>
	</q-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { bnToStringFilter, banPriceFilter } from '@/utils/filters'
import { BigNumber } from 'ethers'

const contractsStore = namespace('contracts')

@Component({
	filters: {
		bnToStringFilter,
		banPriceFilter,
	},
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

.dictionary
	margin-left: -3px
</style>
