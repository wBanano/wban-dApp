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
				<q-avatar v-if="banAddress">
					<img :src="banAddressPicture" :alt="banAddress" />
					<q-tooltip>{{ banAddress }}</q-tooltip>
				</q-avatar>
				<q-btn v-if="isUserConnected" @click="disconnectWalletProvider" flat dense class="btn-disconnect">
					{{ activeAccount | bscAddressFilter }}
				</q-btn>
				<!--q-btn flat round dense icon="apps" class="q-mr-xs" /-->
				<q-btn flat round dense icon="more_vert" />
				<div>wBAN v0.1</div>
			</q-toolbar>
		</q-header>
		<q-page-container>
			<q-banner v-if="!backendOnline || inError" inline-actions class="text-white text-center bg-error">
				{{ errorMessage }}
				<br />
				<a v-if="errorLink !== ''" :href="errorLink">{{ errorLink }}</a>
			</q-banner>
			<router-view />
		</q-page-container>
	</q-layout>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import router from '@/router'
import accounts from '@/store/modules/accounts'
import ban from '@/store/modules/ban'
import backend from '@/store/modules/backend'
import { bscAddressFilter } from '@/utils/filters.ts'

const accountsStore = namespace('accounts')
const banStore = namespace('ban')
const backendStore = namespace('backend')

@Component({
	filters: {
		bscAddressFilter
	}
})
export default class MainLayout extends Vue {
	@accountsStore.State('chainName')
	chainName!: string

	@accountsStore.Getter('isUserConnected')
	isUserConnected!: boolean

	@accountsStore.State('activeAccount')
	activeAccount!: string

	@accountsStore.State('activeBalanceBnb')
	activeBalanceBnb!: number

	@banStore.Getter('banAddress')
	banAddress!: string

	@banStore.Getter('banAddressPicture')
	banAddressPicture!: string

	@backendStore.Getter('online')
	backendOnline!: boolean

	@backendStore.Getter('inError')
	inError!: boolean

	@backendStore.Getter('errorMessage')
	errorMessage!: string

	@backendStore.Getter('errorLink')
	errorLink!: string

	get isMainnet() {
		return this.chainName === 'BSC Mainnet'
	}

	async created() {
		await accounts.initWalletProvider()
		await accounts.ethereumListener()
		await ban.init()
		await backend.initBackend()
	}

	async connectWalletProvider() {
		await accounts.connectWalletProvider()
	}

	async disconnectWalletProvider() {
		await accounts.disconnectWalletProvider()
		router.push('/')
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

.btn-disconnect
	text-transform: none
	font-family: $monospaced-font
	margin-bottom: -5px

.danger
	background-color: $negative
	padding-bottom: 5px
</style>
