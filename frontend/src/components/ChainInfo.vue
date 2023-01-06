<template>
	<div>
		<div class="row q-col-gutter-md justify-center buttons text-center gt-xs">
			<div class="col-3 flex">
				<q-btn @click="depositBAN" color="primary" class="fit" stack>
					<q-icon name="img:ban-deposit.svg" size="3em" />
					<div class="text-button">{{ $t('pages.bridge.button-deposit-ban') }}</div>
					<q-tooltip content-class="bg-positive">{{ $t('pages.bridge.button-deposit-ban-tooltip') }}</q-tooltip>
				</q-btn>
			</div>
			<div class="col-3 flex">
				<q-btn @click="askWithdrawalAmount" :disable="withdrawalDisabled" color="primary" class="fit" stack>
					<q-icon name="img:ban-withdraw.svg" size="3em" />
					<div class="text-button">{{ $t('pages.bridge.button-withdraw-ban') }}</div>
					<q-tooltip content-class="bg-positive">{{ $t('pages.bridge.button-withdraw-ban-tooltip') }}</q-tooltip>
				</q-btn>
			</div>
			<div class="col-3 flex">
				<q-btn @click="swap" color="primary" class="fit" stack>
					<q-icon name="img:wban-swap.svg" size="3em" style="width: 100px" />
					<div class="text-button">{{ $t('pages.bridge.button-swap') }}</div>
					<q-tooltip content-class="bg-positive">{{ $t('pages.bridge.button-swap') }}</q-tooltip>
				</q-btn>
			</div>
			<div class="col-3 flex">
				<q-btn to="/farms" color="primary" class="fit" stack>
					<q-icon name="img:wban-farming.svg" size="3em" />
					<div class="text-button">{{ $t('pages.bridge.button-stake-and-farm') }}</div>
					<q-tooltip content-class="bg-positive">{{ $t('pages.bridge.button-stake-and-farm-tooltip') }}</q-tooltip>
				</q-btn>
			</div>
		</div>
		<div class="row justify-center">
			<div class="col-xl-7 col-lg-9 col-md-11 col-sm-10 col-xs-12">
				<swap-input v-if="!isOwner" :banBalance="banBalance" :wBanBalance="wBanBalance" />
			</div>
		</div>
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
import { WBANTokenWithPermit } from '@artifacts/typechain'
import { BigNumber, ethers } from 'ethers'
import { getAddress } from '@ethersproject/address'
import { sleep } from '@/utils/AsyncUtils'
import { Network } from '@/utils/Networks'
import Dialogs from '@/utils/Dialogs'

const accountsStore = namespace('accounts')
const backendStore = namespace('backend')
const contractsStore = namespace('contracts')

@Component({
	components: {
		SwapInput,
	},
	filters: {
		bnToStringFilter,
	},
})
export default class ChainInfo extends Vue {
	public banAddress = ''

	@accountsStore.Getter('isUserConnected')
	isUserConnected!: boolean

	@backendStore.Getter('banDeposited')
	banBalance!: BigNumber

	@accountsStore.Getter('providerEthers')
	provider!: ethers.providers.Web3Provider | null

	@contractsStore.Getter('wBanBalance')
	wBanBalance!: BigNumber

	@contractsStore.Getter('wbanAddress')
	wbanAddress!: string

	@accountsStore.State('network')
	network!: Network

	get isOwner() {
		if (accounts.activeAccount && contracts.owner) {
			return getAddress(accounts.activeAccount as string) === getAddress(contracts.owner as string)
		} else {
			return false
		}
	}

	get withdrawalDisabled() {
		return !this.banBalance.gt(BigNumber.from(0))
	}

	async depositBAN() {
		Dialogs.startDeposit()
	}

	async askWithdrawalAmount() {
		Dialogs.initiateWithdrawal()
	}

	swap() {
		this.$router.push('/swaps')
	}

	async reloadBalances() {
		console.debug('in reloadBalances')

		// reload data from the backend
		await backend.loadBanDeposited(this.banAddress)

		// reload data from the smart-contract
		const contract: WBANTokenWithPermit | null = contracts.wbanContract
		if (contract && accounts.activeAccount) {
			await contracts.loadBalances({ contract, account: accounts.activeAccount })
		} else {
			this.$q.notify({
				type: 'negative',
				message: 'Unable to reload balances!',
			})
		}
	}

	async onProviderChange() {
		console.warn('Web3 provider was changed to:', this.provider)
		await contracts.initContract(this.provider)
		await this.reloadBalances()
	}

	async mounted() {
		console.debug('in mounted')
		this.banAddress = ban.banAddress
		// wait for Web3 provider to be ready
		while (!this.provider) {
			await sleep(100)
		}
		await this.onProviderChange()
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
	font-weight: normal

#balances
	margin-top: 10px
</style>
