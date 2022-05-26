<template>
	<q-page>
		<div class="row items-center">
			<h6 class="subtitle justify-center offset-md-1">
				<q-btn to="/" icon="arrow_back" text-color="primary" flat style="margin-top: -10px" />
				{{ $t('home') }}
			</h6>
		</div>
		<swaps class="swaps" />
	</q-page>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Swaps from '@/components/Swaps.vue'

@Component({
	components: {
		Swaps,
	},
})
export default class SwapsPage extends Vue {}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

$spacing: $space-base * 0.5

.swaps
	padding-left: $spacing
	padding-top: $spacing
	padding-right: $spacing
	margin-left: auto
	margin-right: auto

@media (max-width: $breakpoint-sm-min)
	h6.subtitle
		margin-top: $space-base !important
		margin-bottom: $space-base !important
</style>
