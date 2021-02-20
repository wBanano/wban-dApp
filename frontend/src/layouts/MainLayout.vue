<template>
	<q-layout view="lHh Lpr lFf">
		<q-header elevated>
			<q-toolbar class="bg-toolbar text-white">
				<a @click="home"><img src="@/assets/wban-logo.png" class="currency-logo"/></a>
				<q-toolbar-title>{{ appTitle }}</q-toolbar-title>
				<q-btn v-if="!isUserConnected" @click="connectWalletProvider" flat dense>Connect</q-btn>
				<q-chip v-if="isUserConnected && !isMainnet" square color="red" text-color="white" icon="warning" class="gt-xs">
					You're not on the mainnet but {{ chainName }}!
				</q-chip>
				<q-avatar v-if="banAddress">
					<img :src="banAddressPicture" :alt="banAddress" />
					<q-tooltip>{{ banAddress }}</q-tooltip>
				</q-avatar>
				<q-btn v-if="isUserConnected" @click="disconnect" flat dense class="btn-disconnect gt-xs">
					{{ activeAccount | bscAddressFilter }}
				</q-btn>
				<q-btn flat round dense icon="redeem" class="text-primary">
					<q-menu id="donations">
						<div class="row no-wrap q-pa-md">
							<div class="column">
								<div class="text-h6 q-mb-md">Donations</div>
								<p>Working on this app has been quite a journey, and still going on!</p>
								<p>
									Tips are always appreciated and if you would like to support my efforts, you can always help me by
									sending Banano tips at: <span class="banano-address">{{ banWalletForTips }}</span>
								</p>
							</div>
							<q-separator vertical inset class="q-mx-lg" />
							<div class="column items-center" v-if="$q.platform.is.desktop">
								<div class="text-subtitle1 q-mt-md q-mb-xs">Tip me at:</div>
								<q-icon :name="banWalletForTipsQRCode" size="128px" />
							</div>
							<q-btn v-if="$q.platform.is.mobile" color="primary" text-color="secondary" label="OK" v-close-popup />
						</div>
					</q-menu>
				</q-btn>
				<q-btn flat round dense icon="more_vert">
					<q-menu>
						<q-list style="min-width: 100px">
							<q-item @click="disconnect" clickable v-close-popup class="xs">
								<q-item-section>Disconnect</q-item-section>
							</q-item>
							<q-item @click="about" clickable v-close-popup>
								<q-item-section>About</q-item-section>
							</q-item>
						</q-list>
					</q-menu>
					<!--
					<q-menu>
						<div class="row no-wrap q-pa-md">
							<div class="column">
								<div class="text-h6 q-mb-md">Settings</div>
								<q-toggle v-model="mobileData" label="Use Mobile Data" />
								<q-toggle v-model="bluetooth" label="Bluetooth" />
							</div>
							<q-separator vertical inset class="q-mx-lg" />
							<div class="column items-center">
								<q-avatar size="72px">
									<img src="https://cdn.quasar.dev/img/avatar4.jpg" />
								</q-avatar>
								<div class="text-subtitle1 q-mt-md q-mb-xs">John Doe</div>
								<q-btn color="primary" label="Logout" push size="sm" v-close-popup />
							</div>
						</div>
					</q-menu>
					-->
				</q-btn>
				<div class="gt-xs">wBAN {{ appVersion }}</div>
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
import QRCode from 'qrcode'

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

	appTitle: string = process.env.VUE_APP_TITLE || 'wBAN -- Broken Release!!!'
	appVersion: string = process.env.VUE_APP_VERSION || '0'

	banWalletForTips = 'ban_3ta69w7cg7jrqswtntxbwaurrhyy44eagtrfeitrzk1hs8ss3qhdwe9gqyiw'
	banWalletForTipsQRCode = ''

	get isMainnet() {
		return this.chainName === 'BSC Mainnet'
	}

	home() {
		router.push('/')
	}

	about() {
		router.push('/about')
	}

	async created() {
		await accounts.initWalletProvider()
		await accounts.ethereumListener()
		await ban.init()
		await backend.initBackend()
		try {
			const qrcode: string = await QRCode.toDataURL(this.banWalletForTips, {
				color: {
					dark: '2A2A2E',
					light: 'FBDD11'
				}
			})
			this.banWalletForTipsQRCode = `img:${qrcode}`
		} catch (err) {
			console.error(err)
		}
	}

	async connectWalletProvider() {
		await accounts.connectWalletProvider()
	}

	async disconnect() {
		await accounts.disconnectWalletProvider()
		await ban.setBanAccount('')
		router.push('/')
	}
}
</script>

<style lang="sass">
@import '@/styles/quasar.sass'

.bg-toolbar
	background-color: $positive !important

//.q-page
//	background-color: $positive

.btn-disconnect
	text-transform: none
	font-family: $monospaced-font
	margin-bottom: -5px

.danger
	background-color: $negative
	padding-bottom: 5px

@media (max-width: 900px)
	#donations
		max-width: 100% !important
		.column, .row
			display: block
@media (min-width: 900px)
	#donations
		max-width: 1000px
</style>
