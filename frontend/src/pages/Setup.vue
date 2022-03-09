<template>
	<div class="q-pa-md">
		<div v-if="choiceMade === ''" class="q-pa-md row items-start justify-center q-gutter-md">
			<q-card class="coming-from-card" flat>
				<q-card-section class="currency-logo">
					<img :src="require(`@/assets/wban-logo-${currentBlockchain.network}.svg`)" width="128px" />
				</q-card-section>
				<q-card-section>
					<div class="title">I'm new to wBAN</div>
					<div class="subtitle">I have Banano and want to start learning DeFi with wBAN.</div>
				</q-card-section>
				<q-card-section class="text-center">
					<q-btn
						@click="
							choiceMade = 'BAN'
							step = 3
						"
						color="primary"
						text-color="black"
						label="Continue"
					/>
				</q-card-section>
			</q-card>
			<q-card class="coming-from-card" flat>
				<q-card-section class="currency-logo">
					<img :src="require('@/assets/banano-logo-big.png')" />
				</q-card-section>
				<q-card-section>
					<div class="title">I'm new to Banano</div>
					<div class="subtitle">I have wBAN and want to use the Banano network.</div>
				</q-card-section>
				<q-card-section class="text-center">
					<q-btn @click="choiceMade = 'wBAN'" color="primary" text-color="black" label="Continue" />
				</q-card-section>
			</q-card>
		</div>

		<q-banner v-if="choiceMade !== ''" inline-actions rounded class="bg-primary text-secondary text-center">
			<p>We need to verify your BAN address!</p>
			<p>This step is important as it ensures that you control the BAN wallet interacting with wBAN.</p>
		</q-banner>

		<q-stepper
			v-if="choiceMade !== ''"
			v-model="step"
			vertical
			:active-color="activeColor"
			:inactive-color="inactiveColor"
			done-color="positive"
			animated
		>
			<q-step :name="1" title="Setup a Banano Wallet" icon="settings" :done="step > 1" v-if="choiceMade === 'wBAN'">
				For the best user experience, we recommend using the Kalium mobile wallet:
				<div class="row">
					<div class="col-sm-auto col-xs-12">
						<a href="https://itunes.apple.com/us/app/kalium/id1449623414?ls=1&mt=8" target="_blank">
							<img :src="require('@/assets/kalium-appstore.svg')" class="kalium" />
						</a>
					</div>
					<div class="col-sm-auto col-xs-12 offset-sm-1">
						<a href="https://play.google.com/store/apps/details?id=com.banano.kaliumwallet&hl=en_US" target="_blank">
							<img :src="require('@/assets/kalium-playstore.svg')" class="kalium" />
						</a>
					</div>
				</div>
				<p>
					If you prefer to use a web wallet, then
					<a href="https://vault.banano.cc/" target="_blank" style="color: $primary">BananoVault</a> web wallet is the
					next best choice.
				</p>
				<p>Click "Continue" button when you have created your wallet.</p>
				<q-stepper-navigation>
					<q-btn @click="step = 2" color="primary" text-color="black" label="Continue" />
				</q-stepper-navigation>
			</q-step>

			<q-step :name="2" title="Get some free Banano" icon="settings" :done="step > 2" v-if="choiceMade === 'wBAN'">
				<p>You need some BAN to do the bridge setup.</p>
				<div>
					Banano has multiple faucets giving some BAN for free, like:
					<ul>
						<li><a href="https://getbanano.cc" target="_blank">iMalFect's Banano Faucet</a></li>
						<li><a href="https://faucet.prussia.dev" target="_blank">Prussia's Banano Faucet</a></li>
					</ul>
				</div>
				<p>Click "Continue" button when you have at least 0.01 BAN in your wallet.</p>
				<q-stepper-navigation>
					<q-btn @click="step = 3" color="primary" text-color="black" label="Continue" />
					<q-btn @click="step = 1" :text-color="activeColor" label="Back" flat class="q-ml-sm" />
				</q-stepper-navigation>
			</q-step>

			<q-step :name="3" title="Banano Address" icon="settings" :done="step > 3">
				<q-form @submit="step = 4">
					<q-input
						v-model="banAddress"
						label="Banano Address"
						class="banano-address"
						dense
						autofocus
						:rules="[
							(val) => !!val || 'Banano address is required',
							(val) => val.match(/^ban_[13][0-13-9a-km-uw-z]{59}$/) || 'Invalid Banano address',
							(val) => this.isNotBlacklisted(val) || 'Blacklisted address',
						]"
					/>
					<q-stepper-navigation>
						<q-btn type="submit" color="primary" text-color="black" label="Continue" />
						<q-btn
							@click="step = 2"
							:text-color="activeColor"
							label="Back"
							flat
							class="q-ml-sm"
							v-if="choiceMade === 'wBAN'"
						/>
					</q-stepper-navigation>
				</q-form>
			</q-step>

			<q-step :name="4" title="Claim your address" icon="create_new_folder" :done="step > 4">
				<p>
					Please verify that your Banano address is indeed <span class="banano-address">{{ banAddress }}</span>
				</p>
				<p>
					This is important as we will <i>link</i> your Banano address with your {{ currentBlockchain.chainName }} one.
				</p>
				<q-stepper-navigation>
					<q-btn @click="claimBananoWallet" color="primary" text-color="secondary" label="Continue" />
					<q-btn @click="step = 3" :text-color="activeColor" label="Back" flat class="q-ml-sm" />
				</q-stepper-navigation>
			</q-step>

			<q-step :name="5" title="Make a Banano deposit" icon="add_comment">
				<div class="row">
					<div class="col-8 col-xs-12">
						<p>
							<strong>Within the next 5 minutes</strong>, you need to confirm your claim by sending a BAN deposit from
							this Banano wallet to this one
							<a class="banano-address" :href="banWalletForDepositsLink">{{ banWalletForDeposits }}</a>
						</p>
						<div v-if="$q.platform.is.desktop" class="row justify-start items-center q-gutter-md">
							<div class="col-2 text-right">
								<q-btn
									@click="copyBanAddressForDepositsToClipboard"
									color="primary"
									text-color="secondary"
									label="Copy Deposit Address"
								/>
								<br />
								or scan QRCode:
							</div>
							<div class="col">
								<q-icon :name="banWalletForDepositsQRCode" size="200px" />
								<br />
							</div>
						</div>
						<p>
							Although any amount would be fine, let's be safe and transfer 0.01 BAN.
							<br />
							Don't worry this deposit will be available for withdrawal if you want so.
						</p>
					</div>
				</div>
				<q-stepper-navigation>
					<q-btn @click="checkBananoDeposit" color="primary" text-color="secondary" label="Check Deposit" />
					<q-btn @click="step = 4" :text-color="activeColor" label="Back" flat class="q-ml-sm" />
				</q-stepper-navigation>
			</q-step>
		</q-stepper>
	</div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import router from '@/router'
import accounts from '@/store/modules/accounts'
import ban from '@/store/modules/ban'
import backend from '@/store/modules/backend'
import { BigNumber, ethers } from 'ethers'
import { ClaimResponse, ClaimResponseResult } from '@/models/ClaimResponse'
import { copyToClipboard } from 'quasar'
import { BananoWalletsBlacklist, BlacklistRecord } from '@/utils/BananoWalletsBlacklist'
import { Network } from '@/utils/Networks'

const accountsStore = namespace('accounts')
const backendStore = namespace('backend')

@Component
export default class SetupPage extends Vue {
	public choiceMade = ''
	public step = 1

	@accountsStore.State('network')
	currentBlockchain!: Network

	@accountsStore.Getter('providerEthers')
	provider!: ethers.providers.Web3Provider | null

	@accountsStore.Getter('isUserConnected')
	isUserConnected!: boolean

	@backendStore.Getter('setupDone')
	setupDone!: boolean

	@backendStore.Getter('banDeposited')
	banDeposited!: BigNumber

	@backendStore.Getter('banWalletForDeposits')
	banWalletForDeposits!: string

	@backendStore.Getter('banWalletForDepositsLink')
	banWalletForDepositsLink!: string

	@backendStore.Getter('banWalletForDepositsQRCode')
	banWalletForDepositsQRCode!: string

	banAddress = ''

	get activeColor(): string {
		if (this.$q.dark.isActive) {
			return 'primary'
		} else {
			return 'secondary'
		}
	}

	get inactiveColor(): string {
		return '#9e9e9e'
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async isNotBlacklisted(banWallet: string): Promise<any> {
		const result: BlacklistRecord | undefined = await BananoWalletsBlacklist.isBlacklisted(banWallet)
		if (result !== undefined) {
			return 'Do not use an exchange or faucet address.'
		} else {
			return true
		}
	}

	async claimBananoWallet() {
		if (!this.provider) {
			throw Error('Missing Web3 provider')
		}
		const result: ClaimResponse = await backend.claimAddresses({
			banAddress: this.banAddress,
			blockchainAddress: accounts.activeAccount as string,
			provider: this.provider,
		})
		switch (result.result) {
			case ClaimResponseResult.Ok:
				this.step = 5
				break
			case ClaimResponseResult.AlreadyDone:
				// skip step 5 and redirect to home if claim was previously done
				ban.setBanAccount(this.banAddress)
				router.push('/')
				break
			default:
				console.log("Can't claim")
		}
	}

	async checkBananoDeposit() {
		console.info(`Should check with the backend if a BAN deposit was made from "${this.banAddress}"`)
		await backend.loadBanDeposited(this.banAddress)
		while (!this.banDeposited.gt(0)) {
			console.log('Waiting for deposit...')
			// eslint-disable-next-line no-await-in-loop
			await new Promise((resolve) => setTimeout(resolve, 5000))
		}
		console.log(`Found a balance of ${this.banDeposited}`)
		ban.setBanAccount(this.banAddress)
		const result = await backend.checkSetupDone(this.banAddress)
		if (result === true) {
			router.push('/')
		} else {
			console.error("Setup didn't work")
		}
	}

	async copyBanAddressForDepositsToClipboard() {
		try {
			await copyToClipboard(this.banWalletForDeposits)
			this.$q.notify({
				type: 'positive',
				message: 'Address copied',
			})
		} catch (err) {
			this.$q.notify({
				type: 'negative',
				message: "Can't write to clipboard!",
			})
		}
	}

	@Watch('setupDone')
	redirect() {
		if (this.setupDone === true) {
			console.warn('Connected?', this.isUserConnected, 'Setup done?', this.setupDone)
			router.push('/')
		}
	}

	async onProviderChange() {
		this.banAddress = ban.banAddress
		if (this.banAddress) {
			this.choiceMade = 'BAN'
			this.step = 4
		}
		if (this.setupDone === true) {
			console.warn('Connected?', this.isUserConnected, 'Setup done?', this.setupDone)
			router.push('/')
		}
	}

	async mounted() {
		console.debug('in mounted')
		this.onProviderChange()
		document.addEventListener('web3-connection', this.onProviderChange)
	}

	async unmounted() {
		document.removeEventListener('web3-connection', this.onProviderChange)
	}
}
</script>

<style lang="sass">
@import '@/styles/quasar.sass'

.coming-from-card
	background-color: lighten($secondary, 5%)
	max-width: 400px
	padding: 20px
	.currency-logo
		padding-bottom: 0
		img
			width: 128px
	.title
		text-align: left
		font-weight: bold
		font-size: 2rem
	.subtitle
		color: darken(white, 20%)
		font-size: 1.3rem

.kalium
	background-color: $secondary
	padding: 10px
	border-radius: 5px

.q-stepper
	a:link, a:visited
		color: $primary

.q-stepper--dark
	background-color: lighten($secondary, 10%) !important
body.body--dark
	.q-field input
		color: white !important
	.q-field__label
		color: $primary !important

.q-field--dark:not(.q-field--highlighted) .q-field__label, .q-field--dark .q-field__marginal, .q-field--dark .q-field__bottom
	color: $primary
</style>
