<template>
	<q-layout view="lHh Lpr lFf">
		<q-header elevated>
			<q-toolbar class="bg-toolbar text-white">
				<img src="@/assets/wban-logo.png" class="currency-logo" />
				<q-toolbar-title>wBAN - Wrap your BAN on Binance Smart Chain</q-toolbar-title>
				<q-btn v-if="!isUserConnected" @click="connectWalletProvider" flat dense>Connect</q-btn>
				<q-chip v-if="isUserConnected && !isMainnet" square color="red" text-color="white" icon="warning">
					You're not on the mainnet but {{ chainName }}!
				</q-chip>
				<q-btn v-if="isUserConnected" @click="disconnectWalletProvider" flat dense class="btn-disconnect">
					{{ activeAccount | bscAddressFilter }}
				</q-btn>
				<!--q-btn flat round dense icon="apps" class="q-mr-xs" /-->
				<q-btn flat round dense icon="more_vert" />
				<div>wBAN v0.1</div>
			</q-toolbar>
		</q-header>
		<q-page-container>
			<router-view />
		</q-page-container>
	</q-layout>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import accounts from '@/store/modules/accounts'
import { bscAddressFilter } from '@/utils/filters.ts'

@Component({
	filters: {
		bscAddressFilter
	}
})
export default class MainLayout extends Vue {
	get chainName() {
		return accounts.chainName
	}

	get isUserConnected() {
		return accounts.isUserConnected
	}

	get isMainnet() {
		return accounts.chainName === 'BSC Mainnet'
	}

	get activeAccount() {
		return accounts.activeAccount
	}

	get activeBalanceBnb() {
		return accounts.activeBalanceBnb
	}

	async created() {
		await accounts.initWalletProvider()
		await accounts.ethereumListener()
	}

	async connectWalletProvider() {
		await accounts.connectWalletProvider()
	}

	async disconnectWalletProvider() {
		await accounts.disconnectWalletProvider()
	}
}
</script>

<style lang="sass">
@import '@/styles/quasar.sass'

.bg-toolbar
	background-color: rgb(38, 48, 72) !important
	//background-color: $secondary !important

//.q-page-container
//	background-color: white

.currency-logo
	width: 32px

.btn-disconnect
	text-transform: none

.danger
	background-color: $negative
	padding-bottom: 5px
</style>
