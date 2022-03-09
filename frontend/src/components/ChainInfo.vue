<template>
	<div>
		<div class="row q-col-gutter-md justify-center buttons text-center gt-xs">
			<div class="col-3 flex">
				<q-btn @click="depositBAN" color="primary" class="fit" stack>
					<q-icon name="img:ban-deposit.svg" size="3em" />
					<div class="text-button">Deposit BAN</div>
					<q-tooltip content-class="bg-positive">Deposit some BAN for swaps</q-tooltip>
				</q-btn>
			</div>
			<div class="col-3 flex">
				<q-btn @click="askWithdrawalAmount" :disable="withdrawalDisabled" color="primary" class="fit" stack>
					<q-icon name="img:ban-withdraw.svg" size="3em" />
					<div class="text-button">Withdraw BAN</div>
					<q-tooltip content-class="bg-positive">Withdraw BAN back to your wallet</q-tooltip>
				</q-btn>
			</div>
			<div class="col-3 flex">
				<q-btn @click="swap" color="primary" class="fit" stack>
					<q-icon name="img:wban-swap.svg" size="3em" style="width: 100px" />
					<div class="text-button">Swap</div>
					<q-tooltip content-class="bg-positive">Swap</q-tooltip>
				</q-btn>
			</div>
			<div class="col-3 flex">
				<q-btn to="/farms" color="primary" class="fit" stack>
					<q-icon name="img:wban-farming.svg" size="3em" />
					<div class="text-button">Stake &amp; Farm</div>
					<q-tooltip content-class="bg-positive">Liquidity Pools Farms</q-tooltip>
				</q-btn>
			</div>
		</div>
		<div class="warnings row justify-center" v-if="warningCode !== ''">
			<div class="col-md-8 col-xs-12">
				<q-banner inline-actions rounded class="bg-primary text-secondary">
					<span v-if="warningCode == 'out-of-ban-and-wban'">You need to deposit more BAN!</span>
					<template v-slot:action>
						<q-btn flat label="Deposit BAN" @click="depositBAN" v-if="warningCode == 'out-of-ban-and-wban'" />
					</template>
				</q-banner>
			</div>
		</div>
		<div class="row justify-center">
			<div class="col-md-7 col-sm-9 col-xs-12">
				<swap-input v-if="!isOwner" :banBalance="banBalance" :wBanBalance="wBanBalance" />
			</div>
		</div>
		<q-dialog v-model="promptForBanDeposit" persistent>
			<q-card class="ban-deposits-dialog">
				<q-card-section>
					<div class="text-h6">BAN Deposits</div>
				</q-card-section>
				<q-card-section class="q-gutter-sm">
					<div class="row">
						<div class="col-md-9 col-xs-12">
							<p>
								If you want to swap more BAN, simply send some BAN from your
								<span class="banano-address gt-sm">{{ banAddress }}</span> wallet to this wallet:
								<strong class="banano-address gt-sm">{{ banWalletForDeposits }}</strong>
								<a class="lt-md banano-address" :href="banWalletForDepositsLink">{{ banWalletForDeposits }}</a>
							</p>
							<p>
								Don't send amounts with more than 2 decimals and make sure there is no raw.<br />
								Using "Max" link in Kalium is probably not going to work well.<br />
								If you don't follow the previous rule, your BAN will be sent back to the wallet you sent them from.
								<b>Make sure you don't withdraw from a CEX straight to this address or you may loose your BAN!</b>
							</p>
						</div>
						<div class="gt-sm col-md-3 text-right">
							<q-icon :name="banWalletForDepositsQRCode" size="200px" />
						</div>
					</div>
				</q-card-section>
				<q-card-actions align="right">
					<q-btn
						@click="copyBanAddressForDepositsToClipboard"
						v-if="!$q.platform.is.mobile"
						color="primary"
						text-color="secondary"
						label="Copy Address"
					/>
					<q-btn color="primary" text-color="secondary" label="OK" v-close-popup />
				</q-card-actions>
			</q-card>
		</q-dialog>
		<q-dialog v-model="promptForBanWithdrawal" persistent>
			<q-card class="ban-withdrawal-dialog">
				<form @submit.prevent.stop="withdrawBAN">
					<q-card-section>
						<div class="text-h6">BAN Withdrawals</div>
					</q-card-section>
					<q-card-section class="q-gutter-sm">
						<swap-currency-input
							ref="currency-input"
							label=""
							:amount.sync="withdrawAmount"
							:balance="banBalance"
							currency="BAN"
							editable
						/>
					</q-card-section>
					<q-card-actions align="right">
						<q-btn flat label="Cancel" color="primary" v-close-popup />
						<q-btn type="submit" color="primary" text-color="secondary" label="Withdraw" />
					</q-card-actions>
				</form>
			</q-card>
		</q-dialog>
	</div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import SwapInput from '@/components/SwapInput.vue'
import SwapCurrencyInput from '@/components/SwapCurrencyInput.vue'
import { bnToStringFilter } from '@/utils/filters'
import ban from '@/store/modules/ban'
import accounts from '@/store/modules/accounts'
import contracts from '@/store/modules/contracts'
import backend from '@/store/modules/backend'
import { WithdrawRequest } from '@/models/WithdrawRequest'
import { WBANToken } from '../../../artifacts/typechain/WBANToken'
import { BigNumber, ethers } from 'ethers'
import { getAddress } from '@ethersproject/address'
import QRCode from 'qrcode'
import { copyToClipboard } from 'quasar'
import { sleep } from '@/utils/AsyncUtils'

const accountsStore = namespace('accounts')
const backendStore = namespace('backend')
const contractsStore = namespace('contracts')

@Component({
	components: {
		SwapInput,
		SwapCurrencyInput,
	},
	filters: {
		bnToStringFilter,
	},
})
export default class ChainInfo extends Vue {
	public banAddress = ''
	public withdrawAmount = ''
	public promptForBanDeposit = false
	public promptForBanWithdrawal = false
	public banWalletForDepositsQRCode = ''

	@Ref('currency-input') readonly currencyInput!: SwapCurrencyInput

	@accountsStore.Getter('isUserConnected')
	isUserConnected!: boolean

	@backendStore.Getter('banDeposited')
	banBalance!: BigNumber

	@backendStore.Getter('banWalletForDeposits')
	banWalletForDeposits!: string

	@backendStore.Getter('banWalletForDepositsLink')
	banWalletForDepositsLink!: string

	@accountsStore.Getter('providerEthers')
	provider!: ethers.providers.Web3Provider | null

	@contractsStore.Getter('wBanBalance')
	wBanBalance!: BigNumber

	@contractsStore.Getter('wbanAddress')
	wbanAddress!: string

	get isOwner() {
		if (accounts.activeAccount && contracts.owner) {
			return getAddress(accounts.activeAccount as string) === getAddress(contracts.owner as string)
		} else {
			return false
		}
	}

	get warningCode() {
		if (this.banBalance.eq(BigNumber.from(0)) && this.wBanBalance.eq(BigNumber.from(0))) {
			return 'out-of-ban-and-wban'
		} else {
			return ''
		}
	}

	get withdrawalDisabled() {
		return !this.banBalance.gt(BigNumber.from(0))
	}

	async depositBAN() {
		this.promptForBanDeposit = true
	}

	async askWithdrawalAmount() {
		this.promptForBanWithdrawal = true
	}

	async withdrawBAN() {
		if (accounts.activeAccount) {
			try {
				if (!this.currencyInput.validate()) {
					return
				}
				await backend.withdrawBAN({
					amount: Number.parseFloat(this.withdrawAmount),
					// amount: Number.parseInt(ethers.utils.formatEther(this.banBalance)),
					banAddress: ban.banAddress,
					blockchainAddress: accounts.activeAccount,
					provider: accounts.providerEthers,
				} as WithdrawRequest)
				this.promptForBanWithdrawal = false
				this.withdrawAmount = ''
				this.$emit('withdrawal')
			} catch (err) {
				console.error("Withdrawal can't be done", err)
			}
		}
	}

	swap() {
		this.$router.push('/swaps')
	}

	async reloadBalances() {
		console.debug('in reloadBalances')

		// reload data from the backend
		await backend.loadBanDeposited(this.banAddress)

		// reload data from the smart-contract
		const contract: WBANToken | null = contracts.wbanContract
		if (contract && accounts.activeAccount) {
			await contracts.loadBalances({ contract, account: accounts.activeAccount })
		} else {
			this.$q.notify({
				type: 'negative',
				message: 'Unable to reload balances!',
			})
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

	async onProviderChange() {
		console.warn('Web3 provider was changed to:', this.provider)
		await contracts.initContract(this.provider)
		await this.reloadBalances()
		try {
			const qrcode: string = await QRCode.toDataURL(this.banWalletForDeposits, {
				scale: 6,
				color: {
					dark: '2A2A2E',
					light: 'FBDD11',
				},
			})
			this.banWalletForDepositsQRCode = `img:${qrcode}`
		} catch (err) {
			console.error(err)
		}
	}

	async mounted() {
		console.debug('in mounted')
		this.banAddress = ban.banAddress
		// wait for Web3 provider to be ready
		while (!this.provider) {
			await sleep(100)
		}
		await this.onProviderChange()
		document.addEventListener('deposit-ban', this.depositBAN)
		document.addEventListener('withdraw-ban', this.askWithdrawalAmount)
		document.addEventListener('reload-balances', this.reloadBalances)
		document.addEventListener('swap', this.swap)
		document.addEventListener('web3-connection', this.onProviderChange)
	}

	async unmounted() {
		await backend.closeStreamConnection()
		document.removeEventListener('web3-connection', this.onProviderChange)
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.currency-logo
	width: 20px
	heigh: 20px
	vertical-align: top

.buttons
	max-width: 700px
	margin-left: auto
	margin-right: auto
	button
		width: 90%

.text-button
	color: $secondary
	text-align: center

#balances
	margin-top: 10px

.warnings
	padding-top: 30px

@media (min-width: 900px)
	.ban-deposits-dialog
		min-width: 900px
</style>
