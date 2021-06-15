<template>
	<div class="about">
		<h1 class="text-center">wBAN - Wrap your BAN on {{ expectedBlockchain.network }}</h1>
	</div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { Network, Networks } from '@/utils/Networks'

@Component
export default class AboutIndex extends Vue {
	get expectedBlockchain(): Network {
		return new Networks().getExpectedNetworkData()
	}
}
</script>

<style lang="sass" scoped>
h1
	font-size: 3rem
</style>
