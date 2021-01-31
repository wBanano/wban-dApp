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
		<div class="row justify-center">
			<div v-if="!isOwner" class="q-pa-md q-gutter-sm">
				<q-btn label="Deposit BAN" @click="depositBAN" color="primary" text-color="text-black" />
				<q-btn label="Deposit BNB" @click="depositBNB" color="primary" text-color="text-black" />
				<q-btn label="Refresh" @click="reloadBalances" color="primary" text-color="text-black" />
				<p class="text-center">
					<strong>Available balance for swap fees: </strong>
					{{ bnbDeposits | bnToString }}
					<img src="@/assets/binance-coin.png" class="currency-logo" />
					BNB
				</p>
			</div>
		</div>
		<div class="row justify-center">
			<div class="col-8">
				<swap-input v-if="!isOwner" :banBalance="banBalance" :wBanBalance="wBanBalance" @swap="reloadBalancesInABit" />
			</div>
		</div>
		<q-dialog v-model="promptForBanDeposit" persistent>
			<q-card style="min-width: 800px">
				<q-card-section>
					<div class="text-h6">BAN Deposits</div>
				</q-card-section>
				<q-card-section class="q-pt-none">
					<div class="row">
						<div class="col-9">
							<p>
								If you want to swap more BAN, simply send some BAN from your
								<span class="banano-address">{{ banAddress }}</span> wallet to this wallet:
								<strong class="banano-address">{{ banWalletForDeposits }}</strong>
							</p>
						</div>
						<div class="col-1"></div>
						<div class="col-2">
							<q-icon :name="banWalletForDepositsQRCode" size="128px" />
						</div>
					</div>
				</q-card-section>
				<q-card-actions align="right">
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
import { bnToStringFilter } from '@/utils/filters.ts'
import ban from '@/store/modules/ban'
import accounts from '@/store/modules/accounts'
import contracts from '@/store/modules/contracts'
import backend from '@/store/modules/backend'
import { WBANToken } from '../../../artifacts/typechain/WBANToken'
import { BigNumber, ethers } from 'ethers'
import { getAddress } from '@ethersproject/address'
import QRCode from 'qrcode'

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

	async depositBAN() {
		this.promptForBanDeposit = true
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

	reloadBalancesInABit() {
		setTimeout(this.reloadBalances, 10_000)
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

	async mounted() {
		console.debug('in mounted')
		await ban.init()
		this.banAddress = ban.banAddress
		await backend.initBackend()
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
	}
}
</script>

<style lang="sass" scoped>
.currency-logo
	width: 20px
	heigh: 20px
	vertical-align: top
</style>
