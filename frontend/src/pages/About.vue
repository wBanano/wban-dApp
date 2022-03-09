<template>
	<div class="about">
		<h1 class="text-center">wBAN - Wrap your BAN on {{ currentBlockchain.network }}</h1>
	</div>
</template>

<script lang="ts">
import { Network } from '@/utils/Networks'
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'

const accountsStore = namespace('accounts')

@Component
export default class AboutIndex extends Vue {
	@accountsStore.State('network')
	currentBlockchain!: Network
}
</script>

<style lang="sass" scoped>
h1
	font-size: 3rem
</style>
