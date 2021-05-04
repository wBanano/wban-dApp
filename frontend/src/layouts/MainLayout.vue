<template>
	<q-layout view="hHh lpR fFf">
		<q-header elevated>
			<q-toolbar class="bg-toolbar text-white">
				<q-btn v-if="drawerEnabled" dense flat round icon="menu" @click="drawerOpened = !drawerOpened" />
				<a @click="home" class="gt-xs"><img src="@/assets/wban-logo.png" class="currency-logo"/></a>
				<q-toolbar-title @click="home">{{ appTitle }}</q-toolbar-title>
				<q-btn v-if="!isUserConnected" @click="connectWalletProvider" flat dense>Connect</q-btn>
				<q-chip v-if="isUserConnected && !isMainnet" square color="red" text-color="white" icon="warning" class="gt-xs">
					You're not on the mainnet but {{ chainName }}!
				</q-chip>
				<q-avatar v-if="banAddress" class="gt-xs">
					<img @click="openBan(banAddress)" :src="banAddressPicture" :alt="banAddress" />
					<q-tooltip>{{ banAddress }}</q-tooltip>
				</q-avatar>
				<q-btn
					v-if="isUserConnected"
					@click="openBsc(activeAccount)"
					flat
					round
					dense
					class="gt-xs"
					icon="img:bsc-logo-only.svg"
				>
					<q-tooltip>{{ activeAccount }}</q-tooltip>
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
				<q-btn flat round dense icon="settings">
					<settings-menu />
				</q-btn>
			</q-toolbar>
		</q-header>
		<q-drawer
			v-if="drawerEnabled"
			v-model="drawerOpened"
			behavior="desktop"
			side="left"
			overlay
			elevated
			:width="230"
			:breakpoint="500"
		>
			<q-list>
				<q-item clickable v-ripple @click="depositBAN">
					<q-item-section avatar>
						<q-icon name="img:ban-deposit.svg" size="3em" />
					</q-item-section>
					<q-separator vertical inset />
					<q-item-section>Deposit BAN</q-item-section>
				</q-item>
				<q-item clickable v-ripple @click="withdrawBAN">
					<q-item-section avatar>
						<q-icon name="img:ban-withdraw.svg" size="3em" />
					</q-item-section>
					<q-separator vertical inset />
					<q-item-section>Withdraw BAN</q-item-section>
				</q-item>
				<!--
				<q-item clickable v-ripple @click="reloadBalances">
					<q-item-section avatar>
						<q-icon name="img:ban-refresh.svg" size="3em" />
					</q-item-section>
					<q-separator vertical inset />
					<q-item-section>Refresh Balances</q-item-section>
				</q-item>
				-->
			</q-list>
		</q-drawer>
		<q-page-container>
			<q-banner v-if="!backendOnline || inError" inline-actions class="text-white text-center bg-error">
				{{ errorMessage }}
				<br />
				<a v-if="errorLink !== ''" :href="errorLink">{{ errorLink }}</a>
			</q-banner>
			<router-view />
		</q-page-container>
		<q-footer @click="openGithub(appVersion)" class="bg-footer">
			<q-icon name="img:github-logo.svg" size="20px" style="margin-top: -3px" /> wBAN v{{ appVersion }}
		</q-footer>
	</q-layout>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Screen } from 'quasar'
import router from '@/router'
import accounts from '@/store/modules/accounts'
import ban from '@/store/modules/ban'
import backend from '@/store/modules/backend'
import SettingsMenu from '@/components/SettingsMenu.vue'
import { bscAddressFilter } from '@/utils/filters'
import QRCode from 'qrcode'
import { openURL } from 'quasar'

const accountsStore = namespace('accounts')
const banStore = namespace('ban')
const backendStore = namespace('backend')

@Component({
	components: {
		SettingsMenu
	},
	filters: {
		bscAddressFilter
	}
})
export default class MainLayout extends Vue {
	@accountsStore.State('chainName')
	chainName!: string

	@accountsStore.State('blockExplorerUrl')
	blockExplorerUrl!: string

	@accountsStore.Getter('isUserConnected')
	isUserConnected!: boolean

	@accountsStore.State('activeAccount')
	activeAccount!: string

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

	drawerOpened = false

	get isMainnet() {
		return this.chainName === 'BSC Mainnet'
	}

	get drawerEnabled() {
		return Screen.lt.sm && this.isUserConnected
	}

	home() {
		if (this.$route.path != '/') {
			router.push('/')
		}
	}

	depositBAN() {
		document.dispatchEvent(new CustomEvent('deposit-ban'))
		this.drawerOpened = false
	}

	withdrawBAN() {
		document.dispatchEvent(new CustomEvent('withdraw-ban'))
		this.drawerOpened = false
	}

	reloadBalances() {
		document.dispatchEvent(new CustomEvent('reload-balances'))
		this.drawerOpened = false
	}

	async created() {
		await accounts.initWalletProvider()
		await accounts.ethereumListener()
		await ban.init()
		await backend.initBackend(this.banAddress)
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

	async unmounted() {
		await backend.closeStreamConnection()
	}

	async connectWalletProvider() {
		await accounts.connectWalletProvider()
	}

	openBsc(address: string) {
		openURL(`${this.blockExplorerUrl}/address/${address}`)
	}

	openBan(address: string) {
		openURL(`https://creeper.banano.cc/explorer/account/${address}`)
	}

	openGithub(version: string) {
		openURL(`https://github.com/wBanano/wban-dApp/releases/tag/v${version}`)
	}
}
</script>

<style lang="sass">
@import '@/styles/quasar.sass'

.bg-toolbar
	background-color: $positive !important

.q-drawer
	background-color: $primary
	.q-item
		color: $secondary
	.q-separator
		background-color: darken($primary, 15%)
		margin-left: -10px
		margin-right: 10px

.bg-footer
	background-color: lighten($secondary, 20%) !important
	text-align: center
	font-size: 1em
	padding-top: 5px
	padding-bottom: 5px

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
	#settings
		max-width: 50% !important
@media (min-width: 900px)
	#donations
		max-width: 1000px
	#settings
		max-width: 400px !important

@media (min-width: $breakpoint-md-min)
	.q-page
		background-image: url('../../public/blocklettuce.png')
		background-position: top right
		background-repeat: no-repeat
		background-attachment: fixed
		background-size: contain
</style>
