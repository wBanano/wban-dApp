<template>
	<div class="hello">
		<div v-if="isUserConnected">
			<p><strong>Your wBAN balance:</strong> {{ wBanBalance }}</p>
			<p><strong>Your BNB available balance for swap:</strong> {{ bnbDeposits }}</p>
			<button @click="depositBNB">Deposit BNB</button>
			<button @click="mint">Mint</button>
			<button @click="reloadBalances">Refresh</button>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import accounts from '@/store/modules/accounts'
import contracts from '@/store/modules/contracts'
import { WBANToken } from '../../../artifacts/typechain/WBANToken'
import { PayableOverrides } from '@ethersproject/contracts'
import { ethers } from 'ethers'

@Component
export default class ChainInfo extends Vue {
	public wBanBalance = ''
	public bnbDeposits = ''

	get isUserConnected() {
		return accounts.isUserConnected
	}

	async depositBNB() {
		const contract: WBANToken | null = contracts.wbanContract
		if (contract) {
			const oneBNB: PayableOverrides = { value: ethers.utils.parseEther('0.01') }
			await contract.bnbDeposit(oneBNB)
		}
	}

	async mint() {
		const contract: WBANToken | null = contracts.wbanContract
		if (contract) {
			await contract.mintTo('0xec410E9F2756C30bE4682a7E29918082Adc12B55', '1000000000000000000', 200_000)
		}
	}

	async reloadBalances() {
		const provider = accounts.providerEthers
		contracts.initContract(provider)
		const contract: WBANToken | null = contracts.wbanContract
		if (contract && accounts.activeAccount) {
			const wBanBalance = await contract.balanceOf(accounts.activeAccount)
			this.wBanBalance = ethers.utils.formatEther(wBanBalance)
			const bnbBalance = await contract.bnbBalanceOf(accounts.activeAccount)
			this.bnbDeposits = ethers.utils.formatEther(bnbBalance)
			console.info(`BNB available balance for swaps for ${accounts.activeAccount}:  ${this.bnbDeposits} BNB`)
		}
		/*
		if (accounts.activeAccount && contracts.wbanContract) {
			await contracts.loadBalances(contracts.wbanContract, accounts.activeAccount)
		}
		*/
	}

	/*
	get wBanBalance() {
		console.debug('trace1')
		await contracts.initContract()
		console.debug('trace1')
		return contracts.wBanBalance
	}
	*/
}
</script>
