<template>
	<div class="container fit q-pa-md">
		<div v-if="choiceMade === ''" class="row items-center justify-center q-gutter-md">
			<q-card class="coming-from-card col-12 col-sm-5" flat bordered>
				<div class="currency-logo">
					<img :src="require(`@/assets/wban-logo-${currentBlockchain.network}.svg`)" />
				</div>
				<div class="title">{{ $t('pages.setup.from-ban') }}</div>
				<div class="subtitle">{{ $t('pages.setup.from-ban-description') }}</div>
				<q-btn
					@click="
						choiceMade = 'BAN'
						step = 3
					"
					class="button"
					color="primary"
					text-color="black"
					:label="$t('pages.setup.continue')"
				/>
			</q-card>
			<q-card class="coming-from-card col-12 col-sm-5" flat bordered>
				<div class="currency-logo">
					<img :src="require('@/assets/banano-logo-big.png')" />
				</div>
				<div class="title">{{ $t('pages.setup.from-wban') }}</div>
				<div class="subtitle">{{ $t('pages.setup.from-wban-description') }}</div>
				<q-btn
					@click="choiceMade = 'wBAN'"
					class="button"
					color="primary"
					text-color="black"
					:label="$t('pages.setup.continue')"
				/>
			</q-card>
			<q-card class="coming-from-card col-12 col-sm-5" flat bordered>
				<div class="title">{{ $t('pages.setup.reconnect-bridge') }}</div>
				<div class="subtitle">{{ $t('pages.setup.reconnect-bridge-description') }}</div>
				<q-btn
					id="relink"
					@click="relink"
					class="button"
					color="primary"
					text-color="black"
					:label="$t('pages.setup.continue')"
				/>
			</q-card>
			<q-card class="coming-from-card col-12 col-sm-5" flat bordered>
				<div class="title">{{ $t('pages.setup.swaps-only') }}</div>
				<div class="subtitle">{{ $t('pages.setup.swaps-only-description') }}</div>
				<q-btn
					@click="buy"
					class="button"
					color="primary"
					text-color="black"
					:label="$t('pages.setup.swaps-only-button')"
				/>
			</q-card>
		</div>

		<q-banner v-if="choiceMade !== ''" inline-actions rounded class="bg-primary text-secondary text-center">
			<p>{{ $t('pages.setup.verify-ban-address') }}</p>
			<p>{{ $t('pages.setup.verify-ban-address-explanation') }}</p>
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
			<q-step
				:name="1"
				:title="$t('pages.setup.step1.title')"
				icon="settings"
				:done="step > 1"
				v-if="choiceMade === 'wBAN'"
			>
				{{ $t('pages.setup.step1.phrase1') }}
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
					<i18n path="pages.setup.step1.phrase2">
						<a href="https://vault.banano.cc/" target="_blank" style="color: $primary">BananoVault</a>
					</i18n>
				</p>
				<p>{{ $t('pages.setup.step1.phrase3') }}</p>
				<q-stepper-navigation>
					<q-btn @click="step = 2" color="primary" text-color="black" :label="$t('pages.setup.continue')" />
				</q-stepper-navigation>
			</q-step>

			<q-step
				:name="2"
				:title="$t('pages.setup.step2.title')"
				icon="settings"
				:done="step > 2"
				v-if="choiceMade === 'wBAN'"
			>
				<p>{{ $t('pages.setup.step2.phrase1') }}</p>
				<div>
					{{ $t('pages.setup.step2.phrase2') }}
					<ul>
						<li><a href="https://getbanano.cc" target="_blank">iMalFect's Banano Faucet</a></li>
						<li><a href="https://faucet.prussia.dev" target="_blank">Prussia's Banano Faucet</a></li>
					</ul>
				</div>
				<p>{{ $t('pages.setup.step2.phrase3') }}</p>
				<q-stepper-navigation>
					<q-btn @click="step = 3" color="primary" text-color="black" :label="$t('pages.setup.continue')" />
					<q-btn @click="step = 1" :text-color="activeColor" :label="$t('pages.setup.back')" flat class="q-ml-sm" />
				</q-stepper-navigation>
			</q-step>

			<q-step :name="3" :title="$t('pages.setup.banano-address')" icon="settings" :done="step > 3">
				<q-form @submit="step = 4">
					<q-input
						v-model="banAddress"
						:label="$t('pages.setup.banano-address')"
						class="banano-address"
						dense
						autofocus
						:rules="[
							(val) => !!val || $t('pages.setup.step3.error-banano-address-required'),
							(val) =>
								val.match(/^ban_[13][0-13-9a-km-uw-z]{59}$/) || $t('pages.setup.step3.error-invalid-banano-address'),
							(val) => isNotBlacklisted(val) || $t('pages.setup.step3.error-blacklisted-address'),
						]"
					/>
					<q-stepper-navigation>
						<q-btn type="submit" color="primary" text-color="black" :label="$t('pages.setup.continue')" />
						<q-btn
							@click="step = 2"
							:text-color="activeColor"
							:label="$t('pages.setup.back')"
							flat
							class="q-ml-sm"
							v-if="choiceMade === 'wBAN'"
						/>
					</q-stepper-navigation>
				</q-form>
			</q-step>

			<q-step :name="4" :title="$t('pages.setup.step4.title')" icon="create_new_folder" :done="step > 4">
				<p>
					{{ $t('pages.setup.step4.phrase1') }} <span class="banano-address">{{ banAddress }}</span>
				</p>
				<p>
					{{ $t('pages.setup.step4.phrase2', { network: currentBlockchain.chainName }) }}
				</p>
				<q-stepper-navigation>
					<q-btn
						@click="claimBananoWallet"
						color="primary"
						text-color="secondary"
						:label="$t('pages.setup.continue')"
					/>
					<q-btn @click="step = 3" :text-color="activeColor" :label="$t('pages.setup.back')" flat class="q-ml-sm" />
				</q-stepper-navigation>
			</q-step>

			<q-step :name="5" :title="$t('pages.setup.step5.title')" icon="add_comment">
				<div class="row">
					<div class="col-8 col-xs-12">
						<p>
							<strong>{{ $t('pages.setup.step5.phrase1') }}</strong
							>, {{ $t('pages.setup.step5.phrase2') }}
							<a class="banano-address" :href="banWalletForDepositsLink">{{ banWalletForDeposits }}</a>
						</p>
						<div v-if="$q.platform.is.desktop" class="row justify-start items-center q-gutter-md">
							<div class="col-2 text-right">
								<q-btn
									@click="copyBanAddressForDepositsToClipboard"
									color="primary"
									text-color="secondary"
									:label="$t('pages.setup.step5.button-copy-deposit-address')"
								/>
								<br />
								{{ $t('pages.setup.step5.phrase3') }}
							</div>
							<div class="col">
								<q-icon :name="banWalletForDepositsQRCode" size="200px" />
								<br />
							</div>
						</div>
						<div v-else class="row justify-around q-pb-sm">
							<q-btn
								:href="kalium(banWalletForDeposits)"
								color="primary"
								text-color="secondary"
								class="col-5"
								:label="$t('menu.donations.kalium')"
							/>
							<q-btn
								@click="copyBanAddressForDepositsToClipboard"
								color="primary"
								text-color="secondary"
								class="col-5"
								:label="$t('dialogs.ban-deposit.button-copy-address')"
							/>
						</div>
						<p>
							{{ $t('pages.setup.step5.phrase4') }}
							<br />
							{{ $t('pages.setup.step5.phrase5') }}
						</p>
					</div>
				</div>
				<q-stepper-navigation>
					<q-btn
						@click="checkBananoDeposit"
						color="primary"
						text-color="secondary"
						:label="$t('pages.setup.step5.button-check-deposit')"
					/>
					<q-btn @click="step = 4" :text-color="activeColor" :label="$t('pages.setup.back')" flat class="q-ml-sm" />
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
import plausible from '@/store/modules/plausible'
import { BigNumber, ethers } from 'ethers'
import { ClaimResponse, ClaimResponseResult } from '@/models/ClaimResponse'
import { copyToClipboard } from 'quasar'
import { BananoWalletsBlacklist, BlacklistRecord } from '@/utils/BananoWalletsBlacklist'
import { Network } from '@/utils/Networks'
import axios from 'axios'
import { SiweMessage } from 'siwe'
import { getBackendHost } from '@/config/constants/backend'

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

	@accountsStore.State('activeAccount')
	activeAccount!: string

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

	kalium(wallet: string) {
		return `ban:${wallet}`
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async isNotBlacklisted(banWallet: string): Promise<any> {
		const result: BlacklistRecord | undefined = await BananoWalletsBlacklist.isBlacklisted(banWallet)
		if (result !== undefined) {
			// track event in Plausible
			this.trackEventInPlausible('Bridge Setup: Blacklisted Wallet')
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
				await backend.initBackend(this.banAddress)
				// track event in Plausible
				this.trackEventInPlausible('Bridge Setup: Linked Again')
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
			await backend.initBackend(this.banAddress)
			this.trackEventInPlausible('Bridge Setup: Completed')
			// redirect to home
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

	async relink() {
		const signer = this.provider?.getSigner()
		// fetch nonce from the backend
		let resp = await axios.get(`${getBackendHost()}/nonce`, { withCredentials: true })
		const nonce = resp.data
		// prepare login request to sign
		const domain = window.location.host
		const origin = window.location.origin
		const message = new SiweMessage({
			domain,
			address: await signer?.getAddress(),
			statement: 'Sign in with Web3 wallet to the dApp',
			uri: origin,
			version: '1',
			chainId: this.currentBlockchain.chainIdNumber,
			nonce,
		})
		const signature = await signer?.signMessage(message.prepareMessage())
		// verify login request
		resp = await axios.post(
			`${getBackendHost()}/verify`,
			{
				message,
				signature,
			},
			{
				withCredentials: true,
			},
		)
		resp = await axios.get(`${getBackendHost()}/relink`, { withCredentials: true })
		const banAddresses: Array<string> = resp.data.banAddresses
		// TODO: deal with more than 1 BAN address
		const banAddress = banAddresses[0]
		console.info(`Relinking ${banAddress} with ${await signer?.getAddress()}`)
		ban.setBanAccount(banAddress)
		const result = await backend.checkSetupDone(banAddress)
		if (result === true) {
			await backend.initBackend(banAddress)
			this.trackEventInPlausible('Bridge Setup: Completed')
			// redirect to home
			router.push('/')
		} else {
			console.error("Setup didn't work")
		}
	}

	buy() {
		router.push({ path: '/swaps', query: { output: 'wban' } })
	}

	@Watch('setupDone')
	redirect() {
		if (this.setupDone === true) {
			console.warn('Connected?', this.isUserConnected, 'Setup done?', this.setupDone)
			router.push('/')
		}
	}

	private trackEventInPlausible(name: string) {
		plausible.trackEvent(name, {
			props: {
				from: this.choiceMade,
				network: this.currentBlockchain.chainName,
			},
		})
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

body.desktop .container
	margin-top: 15%

.coming-from-card
	background-color: lighten($secondary, 5%)
	max-width: 500px
	padding: 20px
	.currency-logo
		float: right
		width: 128px
		height: 128px
		img
			width: 128px
			height: 128px
	.title
		text-align: left
		font-weight: bold
		font-size: 2rem
	.subtitle
		color: darken(white, 20%)
		font-size: 1.3rem
	.button
		margin-left: 25%
		margin-top: 1em
		width: 50%

body.mobile .coming-from-card
	.currency-logo
		width: 96px !important
		height: 96px !important
		img
			width: 96px !important
			height: 96px !important

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
