<template>
	<div>
		<div v-if="isOwner" class="q-pa-md q-gutter-sm">
			<p>Welcome <strong>Benis</strong>!</p>
			<p>Let's mint some wBAN for your fellow monkeys...</p>
			<div>
				<q-input rounded outlined v-model="mintToAddress" label="For (address)" />
				<q-input rounded outlined v-model="mintAmount" label="Amount of wBAN to mint" />
				<div class="text-right">
					<q-btn label="Mint" v-if="isOwner" @click="mint" color="primary" text-color="text-black" />
				</div>
			</div>
		</div>
		<div v-if="!isOwner" class="row justify-center">
			<div class="col-md-10 col-sm-12 col-xs-12">
				<div class="row items-start buttons text-center gt-xs">
					<div class="col-3">
						<q-btn @click="depositBAN" color="primary" stack>
							<q-icon name="img:ban-deposit.svg" size="3em" />
							<div class="text-button">Deposit BAN</div>
							<q-tooltip content-class="bg-positive">Deposit some BAN for swaps</q-tooltip>
						</q-btn>
					</div>
					<div class="col-3">
						<q-btn @click="withdrawBAN" :disable="withdrawalDisabled" color="primary" stack>
							<q-icon name="img:ban-withdraw.svg" size="3em" />
							<div class="text-button">Withdraw BAN</div>
							<q-tooltip content-class="bg-positive">Withdraw BAN back to your wallet</q-tooltip>
						</q-btn>
					</div>
					<div class="col-3">
						<q-btn @click="depositBNB" color="primary" stack>
							<q-icon name="img:bnb-deposit.svg" size="3em" color="secondary" />
							<div class="text-button">BNB<br />Swap Fees</div>
							<q-tooltip content-class="bg-positive">Deposit some BNB for swaps fees</q-tooltip>
						</q-btn>
					</div>
					<div class="col-3">
						<q-btn @click="reloadBalances" color="primary" stack>
							<q-icon name="img:ban-refresh.svg" size="3em" color="secondary" />
							<div class="text-button">Refresh Balances</div>
							<q-tooltip content-class="bg-positive">Refresh balances</q-tooltip>
						</q-btn>
					</div>
				</div>
			</div>
			<p id="balances" class="col-12 text-center">
				<strong>Available balance for swap fees: </strong>
				<br class="xs" />
				{{ bnbDeposits | bnToString }}
				<img src="@/assets/binance-coin.png" class="currency-logo" />
				BNB
			</p>
		</div>
		<div class="row justify-center" v-if="warningCode !== ''">
			<div class="col-md-8 col-xs-12">
				<q-banner inline-actions rounded class="bg-primary text-secondary">
					<span v-if="warningCode == 'out-of-ban-and-wban'">You need to deposit more BAN!</span>
					<span v-if="warningCode == 'out-of-bnb'">You're running low on BNB for fees!</span>
					<template v-slot:action>
						<q-btn flat label="Deposit BAN" @click="depositBAN" v-if="warningCode == 'out-of-ban-and-wban'" />
						<q-btn flat label="Deposit BNB" @click="depositBNB" v-if="warningCode == 'out-of-bnb'" />
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
						</div>
						<div class="gt-sm col-md-3 text-right">
							<q-icon :name="banWalletForDepositsQRCode" size="128px" />
						</div>
					</div>
				</q-card-section>
				<q-card-actions align="right">
					<q-btn
						@click="copyBanAddressForDepositsToClipboard"
						color="primary"
						text-color="secondary"
						label="Copy Address"
					/>
					<q-btn color="primary" text-color="secondary" label="OK" v-close-popup />
				</q-card-actions>
			</q-card>
		</q-dialog>
	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import SwapInput from '@/components/SwapInput.vue'
import { bnToStringFilter } from '@/utils/filters'
import ban from '@/store/modules/ban'
import accounts from '@/store/modules/accounts'
import contracts from '@/store/modules/contracts'
import backend from '@/store/modules/backend'
import WithdrawRequest from '@/models/WithdrawRequest'
import { WBANToken } from '../../../artifacts/typechain/WBANToken'
import { BigNumber, ethers } from 'ethers'
import { getAddress } from '@ethersproject/address'
import QRCode from 'qrcode'
import { copyToClipboard } from 'quasar'

const accountsStore = namespace('accounts')
const backendStore = namespace('backend')
const contractsStore = namespace('contracts')

@Component({
	components: {
		SwapInput
	},
	filters: {
		bnToStringFilter
	}
})
export default class ChainInfo extends Vue {
	public banAddress = ''
	public mintToAddress = ''
	public mintAmount = ''
	public promptForBanDeposit = false
	public banWalletForDepositsQRCode = ''

	@accountsStore.Getter('isUserConnected')
	isUserConnected!: boolean

	@backendStore.Getter('banDeposited')
	banBalance!: BigNumber

	@backendStore.Getter('banWalletForDeposits')
	banWalletForDeposits!: string

	@backendStore.Getter('banWalletForDepositsLink')
	banWalletForDepositsLink!: string

	@contractsStore.Getter('wBanBalance')
	wBanBalance!: BigNumber

	@contractsStore.Getter('bnbDeposits')
	bnbDeposits!: BigNumber

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
		} else if (this.bnbDeposits.lt(ethers.utils.parseEther('0.002'))) {
			return 'out-of-bnb'
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

	async withdrawBAN() {
		if (accounts.activeAccount) {
			await backend.withdrawBAN({
				amount: Number.parseInt(ethers.utils.formatEther(this.banBalance)),
				banAddress: ban.banAddress,
				bscAddress: accounts.activeAccount,
				provider: accounts.providerEthers
			} as WithdrawRequest)
			this.$emit('withdrawal')
		}
	}

	async depositBNB() {
		console.log('in depositBNB')
		const contract: WBANToken | null = contracts.wbanContract
		if (contract) {
			await contract.bnbDeposit({ value: ethers.utils.parseEther('0.01') })
			contract.on('BNBDeposit', () => {
				console.info('BNB were deposited!')
				this.reloadBalances()
			})
		}
	}

	async mint() {
		console.debug('in mint')
		const contract: WBANToken | null = contracts.wbanContract
		if (contract && this.mintToAddress) {
			const rawAmount: string = ethers.utils.parseEther(this.mintAmount).toString()
			await contract.mintTo(this.mintToAddress, rawAmount, 200_000)
			contract.on('Transfer', () => {
				console.info('wBAN were minted!')
				this.reloadBalances()
			})
		}
	}

	async reloadBalances() {
		console.debug('in reloadBalances')

		// reload data from the backend
		await backend.loadBanDeposited(this.banAddress)

		// reload data from the smart-contract
		const provider = accounts.providerEthers
		await contracts.initContract(provider)
		const contract: WBANToken | null = contracts.wbanContract
		if (contract && accounts.activeAccount) {
			await contracts.loadBalances({ contract, account: accounts.activeAccount })
		}
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
		await ban.init()
		this.banAddress = ban.banAddress
		await backend.initBackend(this.banAddress)
		await this.reloadBalances()
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
		document.addEventListener('deposit-ban', this.depositBAN)
		document.addEventListener('withdraw-ban', this.withdrawBAN)
		document.addEventListener('deposit-bnb', this.depositBNB)
		document.addEventListener('reload-balances', this.reloadBalances)
	}

	async unmounted() {
		await backend.closeStreamConnection()
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
	max-width: 500px
	margin-left: auto
	margin-right: auto
	button
		width: 90%
//		margin-left: 5px
//		width: 110px
//	:first-child
//		margin-left: 0 !important

.text-button
	color: $secondary
	text-align: center

#balances
	margin-top: 10px

@media (min-width: 900px)
	.ban-deposits-dialog
		min-width: 900px
</style>
