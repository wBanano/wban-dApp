<template>
	<div>
		<div v-if="isOwner" class="q-pa-md q-gutter-sm">
			<p>Welcome <strong>Benis</strong>!</p>
			<p>Let's mint some wBAN for your fellow monkeys...</p>
			<q-btn label="Mint" v-if="isOwner" @click="mint" color="primary" text-color="text-black" />
		</div>
		<div v-if="!isOwner" class="q-pa-md q-gutter-sm">
			<q-btn label="Deposit BAN" v-if="!isOwner" @click="depositBAN" color="primary" text-color="text-black" />
			<q-btn label="Deposit BNB" v-if="!isOwner" @click="depositBNB" color="primary" text-color="text-black" />
			<q-btn label="Refresh" v-if="!isOwner" @click="reloadBalances" color="primary" text-color="text-black" />
			<p class="text-right"><strong>Available balance for swap fees:</strong> {{ bnbDeposits | bnToString }} BNB</p>
		</div>
		<swap-input v-if="!isOwner" :banBalance="banBalance" :wBanBalance="wBanBalance" />
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
import SwapInput from '@/components/SwapInput.vue'
import { bnToStringFilter } from '@/utils/filters.ts'
import ban from '@/store/modules/ban'
import accounts from '@/store/modules/accounts'
import contracts from '@/store/modules/contracts'
import { WBANToken } from '../../../artifacts/typechain/WBANToken'
import { BigNumber, ethers } from 'ethers'
import { getAddress } from '@ethersproject/address'

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
	public wBanBalance: BigNumber = BigNumber.from(0)
	public bnbDeposits: BigNumber = BigNumber.from(0)
	public promptForBanDeposit = false

	get isUserConnected() {
		return accounts.isUserConnected
	}

	get isOwner() {
		if (accounts.activeAccount && contracts.owner) {
			return getAddress(accounts.activeAccount as string) === getAddress(contracts.owner as string)
		} else {
			return false
		}
	}

	get banBalance(): BigNumber {
		return ban.banDeposited
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
		if (contract) {
			await contract.mintTo('0x69FD25B60Da76Afd10D8Fc7306f10f2934fC4829', '1000000000000000000', 200_000)
			contract.on('Transfer', () => {
				console.info('wBAN were minted!')
				this.reloadBalances()
			})
		}
	}

	async reloadBalances() {
		console.debug('in reloadBalances')

		// reload data from the backend
		await ban.loadBanDeposited(this.banAddress)

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
		ban.init()
		this.banAddress = ban.banAddress
		this.reloadBalances()
	}
}
</script>
