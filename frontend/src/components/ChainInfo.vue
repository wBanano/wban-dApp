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
			<q-card style="min-width: 600px">
				<q-card-section>
					<div class="text-h6">Your BAN Address</div>
				</q-card-section>
				<q-card-section class="q-pt-none">
					<q-input dense v-model="banAddress" autofocus @keyup.enter="promptForBanDeposit = false" />
				</q-card-section>
				<q-card-actions align="right">
					<q-btn color="primary" text-color="black" label="Cancel" v-close-popup />
					<q-btn color="primary" text-color="black" label="Save" v-close-popup />
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

const accountsStore = namespace('accounts')
const backendStore = namespace('backend')

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
	public wBanBalance: BigNumber = BigNumber.from(0)
	public bnbDeposits: BigNumber = BigNumber.from(0)
	public promptForBanDeposit = false

	@accountsStore.Getter('isUserConnected')
	isUserConnected!: boolean

	@backendStore.Getter('banDeposited')
	banBalance!: BigNumber

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
			this.wBanBalance = await contract.balanceOf(accounts.activeAccount)
			this.bnbDeposits = await contract.bnbBalanceOf(accounts.activeAccount)
			console.info(`BNB available balance for swaps for ${accounts.activeAccount}:  ${this.bnbDeposits} BNB`)
		}
		/*
		if (accounts.activeAccount && contracts.wbanContract) {
			await contracts.loadBalances(contracts.wbanContract, accounts.activeAccount)
		}
		*/
	}

	async mounted() {
		console.debug('in mounted')
		await ban.init()
		this.banAddress = ban.banAddress
		await backend.initBackend()
		await this.reloadBalances()
	}
}
</script>

<style lang="sass" scoped>
.currency-logo
	width: 20px
	heigh: 20px
	vertical-align: top
</style>
