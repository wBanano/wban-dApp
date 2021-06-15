<template>
	<div class="q-pa-md">
		<q-banner inline-actions rounded class="bg-primary text-secondary text-center">
			<p>We need to verify your BAN address!</p>
			<p>This step is important as it ensures that no one else than you can claim wBAN.</p>
		</q-banner>

		<q-stepper
			v-model="step"
			vertical
			:active-color="activeColor"
			:inactive-color="inactiveColor"
			done-color="positive"
			animated
		>
			<q-step :name="1" title="Banano Address" icon="settings" :done="step > 1">
				<q-form @submit="step = 2">
					<q-input
						v-model="banAddress"
						label="Banano Address"
						class="banano-address"
						dense
						autofocus
						:rules="[
							val => !!val || 'Banano address is required',
							val => val.match(/^ban_[13][0-13-9a-km-uw-z]{59}$/) || 'Invalid Banano address'
						]"
					/>
					<q-stepper-navigation>
						<q-btn type="submit" color="primary" text-color="black" label="Continue" />
					</q-stepper-navigation>
				</q-form>
			</q-step>

			<q-step :name="2" title="Claim your address" icon="create_new_folder" :done="step > 2">
				<p>
					Please verify that your Banano address is indeed <span class="banano-address">{{ banAddress }}</span>
				</p>
				<p>
					This is important as we will <i>link</i> your Banano address with your {{ expectedBlockchain.chainName }} one.
				</p>
				<q-stepper-navigation>
					<q-btn @click="claimBananoWallet" color="primary" text-color="secondary" label="Continue" />
					<q-btn @click="step = 1" :text-color="activeColor" label="Back" flat class="q-ml-sm" />
				</q-stepper-navigation>
			</q-step>

			<q-step :name="3" title="Make a Banano deposit" icon="add_comment">
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
								<q-icon :name="banWalletForDepositsQRCode" size="128px" />
								<br />
							</div>
						</div>
						<p>
							Although any amount would be fine, let's be safe and only transfer 1 BAN.
						</p>
					</div>
				</div>
				<q-stepper-navigation>
					<q-btn @click="checkBananoDeposit" color="primary" text-color="secondary" label="Check Deposit" />
					<q-btn @click="step = 2" :text-color="activeColor" label="Back" flat class="q-ml-sm" />
				</q-stepper-navigation>
			</q-step>
		</q-stepper>
	</div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import router from '@/router'
import accounts from '@/store/modules/accounts'
import ban from '@/store/modules/ban'
import backend from '@/store/modules/backend'
import { BigNumber } from 'ethers'
import QRCode from 'qrcode'
import { ClaimResponse } from '@/models/ClaimResponse'
import { copyToClipboard } from 'quasar'
import { Network, Networks } from '@/utils/Networks'

const accountsStore = namespace('accounts')
const backendStore = namespace('backend')

@Component
export default class SetupPage extends Vue {
	public banAddress = ''
	public step = 1

	@accountsStore.Getter('isUserConnected')
	isUserConnected!: boolean

	@backendStore.Getter('banDeposited')
	banDeposited!: BigNumber

	@backendStore.Getter('banWalletForDeposits')
	banWalletForDeposits!: string

	@backendStore.Getter('banWalletForDepositsLink')
	banWalletForDepositsLink!: string

	banWalletForDepositsQRCode = ''

	get expectedBlockchain(): Network {
		return new Networks().getExpectedNetworkData()
	}

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

	async claimBananoWallet() {
		const result: ClaimResponse = await backend.claimAddresses({
			banAddress: this.banAddress,
			blockchainAddress: accounts.activeAccount as string,
			provider: accounts.providerEthers
		})
		switch (result) {
			case ClaimResponse.Ok:
				this.step = 3
				break
			case ClaimResponse.AlreadyDone:
				// skip step 3 and redirect to home if claim was previously done
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
			await new Promise(resolve => setTimeout(resolve, 5000))
		}
		console.log(`Found a balance of ${this.banDeposited}`)
		ban.setBanAccount(this.banAddress)
		router.push('/')
	}

	async copyBanAddressForDepositsToClipboard() {
		try {
			await copyToClipboard(this.banWalletForDeposits)
			this.$q.notify({
				type: 'positive',
				message: 'Address copied'
			})
		} catch (err) {
			this.$q.notify({
				type: 'negative',
				message: "Can't write to clipboard!"
			})
		}
	}

	async mounted() {
		console.debug('in mounted')
		ban.init()
		await backend.initBackend(this.banAddress)
		if (!this.isUserConnected) {
			router.push('/')
		}
		this.banAddress = ban.banAddress
		try {
			const qrcode: string = await QRCode.toDataURL(this.banWalletForDeposits, {
				color: {
					dark: '2A2A2E',
					light: 'FBDD11'
				}
			})
			this.banWalletForDepositsQRCode = `img:${qrcode}`
		} catch (err) {
			console.error(err)
		}
	}

	async unmounted() {
		await backend.closeStreamConnection()
	}
}
</script>

<style lang="sass">
@import '@/styles/quasar.sass'

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
