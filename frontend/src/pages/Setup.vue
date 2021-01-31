<template>
	<div class="q-pa-md">
		<q-banner inline-actions rounded class="bg-primary text-black text-center">
			<p>We need to verify your BAN address!</p>
			<p>This step is important as it ensures that no one else than you can claim wBAN.</p>
		</q-banner>

		<q-stepper v-model="step" vertical active-color="secondary" done-color="positive" animated>
			<q-step :name="1" title="Banano Address" icon="settings" :done="step > 1">
				<q-input
					dense
					v-model="banAddress"
					autofocus
					@keyup.enter="promptForBanDeposit = false"
					label="Banano Address"
					class="banano-address"
				/>
				<q-stepper-navigation>
					<q-btn @click="step = 2" color="primary" text-color="black" label="Continue" />
				</q-stepper-navigation>
			</q-step>

			<q-step :name="2" title="Claim your address" icon="create_new_folder" :done="step > 2">
				<p>
					Please verity that your Banano address is indeed <span class="banano-address">{{ banAddress }}</span>
				</p>
				<p>This is important as we will <i>link</i> your Banano address with your Binance Smart Chain one.</p>
				<q-stepper-navigation>
					<q-btn @click="claimBananoWallet" color="primary" text-color="secondary" label="Continue" />
					<q-btn flat @click="step = 1" color="secondary" label="Back" class="q-ml-sm" />
				</q-stepper-navigation>
			</q-step>

			<q-step :name="3" title="Make a Banano deposit" icon="add_comment">
				<div class="row">
					<div class="col-8">
						<p>
							<strong>Within the next 5 minutes</strong>, you need to confirm your claim by sending a BAN deposit from
							this Banano wallet to this one <span class="banano-address">{{ banWalletForDeposits }}</span>
						</p>
						<p>
							Although any amount would be fine, let's be safe and only transfer 1 BAN.
						</p>
					</div>
					<div class="col-4">
						<q-icon :name="banWalletForDepositsQRCode" size="128px" />
					</div>
				</div>
				<q-stepper-navigation>
					<q-btn @click="checkBananoDeposit" color="primary" text-color="secondary" label="Check Deposit" />
					<q-btn flat @click="step = 2" color="secondary" label="Back" class="q-ml-sm" />
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

	banWalletForDepositsQRCode = ''

	async claimBananoWallet() {
		const result = await backend.claimAddresses({
			banAddress: this.banAddress,
			bscAddress: accounts.activeAccount as string,
			provider: accounts.providerEthers
		})
		if (result) {
			this.step = 3
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

	async mounted() {
		console.debug('in mounted')
		await ban.init()
		await backend.initBackend()
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
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.banano-address
	font-family: $monospaced-font
</style>
