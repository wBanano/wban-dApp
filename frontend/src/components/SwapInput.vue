<template>
	<form @submit.prevent.stop="swap">
		<div class="q-pa-md q-gutter-sm">
			<div class="column items-end">
				<div class="col">
					<q-btn to="/history" flat icon="history" :label="$t('pages.history.title')" color="primary" size="md">
						<q-tooltip>{{ $t('pages.history.title-tooltip') }}</q-tooltip>
					</q-btn>
					<q-badge v-if="unclaimedWraps > 0" color="primary" text-color="secondary">
						{{ unclaimedWraps }}
						<q-icon name="warning" size="14px" class="q-ml-xs" />
					</q-badge>
				</div>
			</div>
			<div class="warnings row justify-center" v-if="warningCode !== ''">
				<div class="col-12">
					<q-banner v-if="warningCode !== ''" inline-actions rounded class="bg-primary text-secondary text-center">
						<span v-if="warningCode === 'gasless-wrap-lacking-ban'">
							{{ $t('components.wrap-form.gasless-wrap-lacking-ban', [missingBANForGaslessWrap]) }}
						</span>
						<span v-if="warningCode === 'gasless-wrap'">
							{{ $t('components.wrap-form.gasless-wrap', [gaslessSettings.banThreshold]) }}
						</span>
						<template v-slot:action>
							<q-btn
								v-if="warningCode === 'gasless-wrap'"
								color="secondary"
								textColor="primary"
								:label="$t('components.wrap-form.button-gasless-wrap')"
								@click="
									setToMax()
									swap()
								"
							/>
						</template>
					</q-banner>
				</div>
			</div>
			<swap-currency-input
				ref="from"
				:label="$t('components.wrap-form.from')"
				:amount.sync="amount"
				:balance="fromBalance"
				:currency="fromCurrency"
				editable
			/>
			<div id="swap-icon" class="text-center">
				<q-icon @click="switchCurrencyInputs" name="swap_vert" class="cursor-pointer arrow-down text-center" />
			</div>
			<swap-currency-input
				ref="to"
				:label="$t('components.wrap-form.to')"
				:amount="amount"
				:balance="toBalance"
				:currency="toCurrency"
			/>
			<div class="text-right">
				<q-btn :label="swapLabel" type="submit" :disable="!swapEnabled" color="primary" text-color="text-black" />
			</div>
		</div>
	</form>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import SwapCurrencyInput from '@/components/SwapCurrencyInput.vue'
import { ethers, BigNumber } from 'ethers'
import accounts from '@/store/modules/accounts'
import ban from '@/store/modules/ban'
import backend from '@/store/modules/backend'
import contracts from '@/store/modules/contracts'
import { WBANTokenWithPermit } from '@artifacts/typechain'
import Dialogs from '@/utils/Dialogs'
import { Network } from '@/utils/Networks'
import { GaslessSettings } from '@/models/GaslessSettings'

const banStore = namespace('ban')
const accountsStore = namespace('accounts')
const backendStore = namespace('backend')

@Component({
	components: {
		SwapCurrencyInput,
	},
})
export default class SwapInput extends Vue {
	@Prop({ type: Object, required: true }) banBalance!: BigNumber
	@Prop({ type: Object, required: true }) wBanBalance!: BigNumber
	@Ref('from') readonly fromInput!: SwapCurrencyInput
	@Ref('to') readonly toInput!: SwapCurrencyInput

	fromCurrency = ''
	toCurrency = ''

	@banStore.Getter('banAddress')
	banAddress!: string

	@accountsStore.State('activeBalance')
	activeCryptoBalance!: BigNumber

	@accountsStore.Getter('activeCryptoBalance')
	cryptoBalance!: string

	@accountsStore.State('network')
	network!: Network

	@backendStore.Getter('gaslessSettings')
	gaslessSettings!: GaslessSettings

	@backendStore.Getter('swaps')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	swaps!: Array<any>

	amount = ''
	swapInProgress = false

	get fromBalance() {
		if (this.fromCurrency === 'BAN') {
			return this.banBalance
		} else {
			return this.wBanBalance
		}
	}

	get toBalance() {
		if (this.toCurrency === 'BAN') {
			return this.banBalance
		} else {
			return this.wBanBalance
		}
	}

	get swapLabel() {
		if (this.toCurrency === 'BAN') {
			return this.$t('components.wrap-form.button-unwrap')
		} else if (this.isAmountEligibleForGaslessWrap) {
			return this.$t('components.wrap-form.button-gasless-wrap')
		} else {
			return this.$t('components.wrap-form.button-wrap')
		}
	}

	get swapEnabled() {
		return (
			this.amount &&
			Number.parseFloat(this.amount) > 0 &&
			this.fromBalance.gte(ethers.utils.parseEther(this.amount)) &&
			!this.swapInProgress
		)
	}

	get wrapAlreadyDone(): boolean {
		return this.swaps.length > 0
	}

	get unclaimedWraps(): number {
		return this.swaps.filter((swap) => swap.type === 'swap-to-wban' && swap.consumed === false).length
	}

	get banBalanceMatches(): boolean {
		return this.banBalance.gte(ethers.utils.parseEther(this.gaslessSettings.banThreshold.toString()))
	}

	get cryptoBalanceMatches(): boolean {
		return this.activeCryptoBalance.lte(ethers.utils.parseEther(this.gaslessSettings.cryptoThreshold.toString()))
	}

	get isEligibleForGaslessWrap(): boolean {
		return !this.wrapAlreadyDone && this.gaslessSettings.enabled && this.banBalanceMatches && this.cryptoBalanceMatches
	}

	get isAmountEligibleForGaslessWrap(): boolean {
		const banAmountMatches = Number.parseFloat(this.amount) >= this.gaslessSettings.banThreshold
		return !this.wrapAlreadyDone && banAmountMatches && this.cryptoBalanceMatches && this.gaslessSettings.enabled
	}

	get missingBANForGaslessWrap(): number {
		const banBalanceStr = ethers.utils.formatEther(this.banBalance)
		const amount = this.gaslessSettings.banThreshold - Number.parseFloat(banBalanceStr)
		return Math.max(0, Math.ceil(amount * 100) / 100)
	}

	get warningCode(): string {
		if (this.wrapAlreadyDone) {
			console.debug('User already made a wrap')
			return ''
		} else if (this.isEligibleForGaslessWrap) {
			return 'gasless-wrap'
		} else if (this.gaslessSettings.enabled && this.missingBANForGaslessWrap > 0) {
			return 'gasless-wrap-lacking-ban'
		}
		return ''
	}

	setToMax() {
		this.amount = ethers.utils.formatEther(this.fromBalance)
	}

	switchCurrencyInputs() {
		const tempCurrency: string = this.toCurrency
		this.toCurrency = this.fromCurrency
		this.fromCurrency = tempCurrency
		this.resetValidation()
	}

	resetValidation() {
		this.fromInput.resetValidation()
		this.toInput.resetValidation()
	}

	async swap() {
		if (!this.fromInput.validate()) {
			return
		}

		// check that the user as at sufficient crypto available for wrapping costs if this isn't a gasless wrap
		console.debug(`Required crypto balance: ${this.network.minimumNeededForWrap} ${this.network.nativeCurrency.symbol}`)
		if (
			!this.isAmountEligibleForGaslessWrap &&
			this.fromCurrency === 'BAN' &&
			Number.parseFloat(this.cryptoBalance) < this.network.minimumNeededForWrap
		) {
			Dialogs.showGasNeededError(Number.parseFloat(this.cryptoBalance))
			return
		} else {
			console.info(`Crypto balance is: ${this.cryptoBalance} ${this.network.nativeCurrency.symbol}`)
		}

		// warn use if wrapping/unwrapping less than 100 BAN/wBAN
		if (Number.parseFloat(this.amount) <= 100) {
			const proceed = await Dialogs.showLowAmountToWrapWarning(Number.parseFloat(this.amount))
			if (!proceed) {
				return
			}
		}

		if (accounts.activeAccount && this.amount) {
			this.swapInProgress = true
			if (this.fromCurrency === 'BAN') {
				await backend.swap({
					amount: Number.parseFloat(this.amount),
					banAddress: ban.banAddress,
					blockchainAddress: accounts.activeAccount,
					provider: accounts.providerEthers,
				})
				await backend.getHistory({
					blockchainAddress: accounts.activeAccount,
					banAddress: this.banAddress,
				})
			} else {
				const contract: WBANTokenWithPermit | null = contracts.wbanContract
				if (contract) {
					console.info(`Swap from wBAN to BAN requested for ${this.amount} BAN to ${this.banAddress}`)
					await contracts.swap({
						amount: ethers.utils.parseEther(this.amount),
						toBanAddress: this.banAddress,
						contract,
					})
				}
			}
			this.$emit('swap')
			this.amount = ''
			this.swapInProgress = false
		}
	}

	async mounted() {
		if (accounts.activeAccount) {
			await backend.getHistory({
				blockchainAddress: accounts.activeAccount,
				banAddress: this.banAddress,
			})
		}
	}

	created() {
		this.fromCurrency = 'BAN'
		this.toCurrency = 'wBAN'
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.warnings
	padding-bottom: 1rem

.arrow-down
	font-size: 32px
	text-align: center

body.body--dark #swap-icon
	color: $primary
</style>
