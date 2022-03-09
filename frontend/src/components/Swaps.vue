<template>
	<div class="swaps q-gutter-sm">
		<token-input
			ref="from"
			label="From"
			v-model="from"
			@token-changed="onInputTokenChanged($event)"
			@update:amount="getSwapQuote($event)"
			class="token-input"
		/>
		<div id="swap-icon">
			<q-btn @click="switchCurrencyInputs" icon="swap_vert" round flat text-color="primary" size="16px" />
		</div>
		<token-input
			ref="to"
			label="To"
			v-model="to"
			disable
			@token-changed="onOutputTokenChanged($event)"
			class="token-input"
		/>
		<q-card class="swap-details" bordered>
			<div class="row q-pa-sm">
				<div class="col-12 section-title">Transaction Settings</div>
				<div class="col-6">Slippage Tolerance</div>
				<div class="col-6 text-right">
					0.2%
					<q-icon name="info" class="dictionary vertical-top">
						<q-tooltip>
							You will be able to specify the slippage later.<br />
							Right now this is a very conservative value which may make swaps to fail.
						</q-tooltip>
					</q-icon>
				</div>
				<div class="col-6">Allowance</div>
				<div class="col-6 text-right">
					<q-btn-toggle
						v-model="allowanceSetting"
						no-caps
						rounded
						unelevated
						color="light-secondary"
						toggle-text-color="secondary"
						text-color="primary"
						size="xs"
						:options="[
							{ label: 'Exact Amount', value: 'exact' },
							{ label: 'Unlimited', value: 'unlimited' },
						]"
					/>
					<q-icon name="info" class="dictionary vertical-top">
						<q-tooltip>
							Amount of {{ from.token.symbol }} the exchange can move on your behalf.<br /><br />
							Exact Amount: Approve each time, safer but less convenient.<br />
							Unlimited: Approve only once, more convenient but less safe.<br />
						</q-tooltip>
					</q-icon>
				</div>
				<hr class="col-12" />
				<div class="col-6">Estimated Gas Fee</div>
				<div class="col-6 text-right">{{ estimatedFee }}</div>
			</div>
		</q-card>
		<q-card class="swap-route" bordered>
			<div class="row q-pa-sm">
				<q-expansion-item class="col-12" expand-separator icon="alt_route" label="Exchange Route">
					<q-card>
						<q-card-section>
							<div v-for="path in quote.route" v-bind:key="path.source">
								- {{ path.source }}: {{ path.from.symbol }} -> {{ path.to.symbol }}
							</div>
						</q-card-section>
					</q-card>
				</q-expansion-item>
			</div>
		</q-card>
		<div class="swap-actions">
			<q-btn
				id="btn-approve"
				v-if="approveLabel !== ''"
				:label="approveLabel"
				@click="approve()"
				color="primary"
				text-color="text-secondary"
			/>
			<q-btn
				id="btn-swap"
				v-if="approveLabel === ''"
				@click="swap()"
				:label="swapLabel"
				:disable="!swapEnabled"
				:color="swapButtonBackgroundColor"
				:text-color="swapButtonTextColor"
				:class="swapButtonClass"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import TokensUtil from '@/utils/TokensUtil'
import { BigNumber, ethers, Signer } from 'ethers'
import { Token } from '@/config/constants/dex'
import { BigNumberish } from 'ethers'
import TokenInput from '@/components/tokens/TokenInput.vue'
import { TokenAmount, emptyTokenAmount } from '@/models/dex/TokenAmount'
import { Network, Networks } from '@/utils/Networks'
import { DEXUtils } from '@/utils/DEXUtils'
import { sleep } from '@/utils/AsyncUtils'
import { SwapQuoteResponse, EMPTY_QUOTE } from '@/models/dex/SwapQuote'
import { TransactionRequest } from '@ethersproject/providers'
import { IERC20, IERC20__factory } from '@artifacts/typechain'
import SwapDialogs from '@/utils/SwapDialogs'
import Accounts from '@/store/modules/accounts'
import { Logger } from 'ethers/lib/utils'

const accountsStore = namespace('accounts')
const pricesStore = namespace('prices')

@Component({
	components: {
		TokenInput,
	},
})
export default class Swaps extends Vue {
	@Ref('from') readonly fromInput!: TokenInput
	@Ref('to') readonly toInput!: TokenInput

	from: TokenAmount = emptyTokenAmount()
	to: TokenAmount = emptyTokenAmount()

	gas: BigNumber = BigNumber.from(0)
	gasPrice: BigNumberish = BigNumber.from(0)

	quote: SwapQuoteResponse = EMPTY_QUOTE

	allowanceSetting = 'unlimited'
	approveLabel = ''

	swapEnabled = false
	swapInProgress = false
	swapLabel = 'Swap'
	swapButtonClass = ''
	swapButtonTextColor = 'secondary'
	swapButtonBackgroundColor = 'primary'

	@accountsStore.State('activeAccount')
	user!: string

	@accountsStore.State('network')
	network!: Network

	@accountsStore.Getter('providerEthers')
	provider!: ethers.providers.Web3Provider | null

	@pricesStore.Getter('prices')
	prices!: Map<string, number>

	get gasPriceFormatted(): string {
		return `${ethers.utils.formatUnits(this.gasPrice, 'gwei')} gwei`
	}

	get estimatedFee(): string {
		const cryptoPrice: number = this.prices.get(this.network.nativeCurrency.symbol) || 0
		if (cryptoPrice === 0 || this.quote.price === '') {
			return ''
		}
		const gasFee: BigNumber = this.gas.mul(ethers.utils.parseUnits(this.gasPrice.toString(), 'wei'))
		const usdFee = Number.parseFloat(ethers.utils.formatEther(gasFee).toString()) * cryptoPrice
		return `$${usdFee.toFixed(2)}`
	}

	onInputTokenChanged(token: Token) {
		this.from.token = token
		this.swapLabel = 'Swap'
		this.swapButtonClass = ''
		this.swapButtonTextColor = 'secondary'
		this.swapButtonBackgroundColor = 'primary'
	}

	onOutputTokenChanged(token: Token) {
		this.to.token = token
		this.getSwapQuote(this.from.amount)
	}

	async switchCurrencyInputs() {
		// switch tokens
		const tempTokenAmount: TokenAmount = this.from
		this.from = this.to
		this.to = tempTokenAmount
		await sleep(1_000)
		await this.fromInput.loadBalance()
		await this.toInput.loadBalance()
		this.approveLabel = ''
		this.quote = EMPTY_QUOTE
		this.resetValidation()
	}

	async getSwapQuote(amountIn: string) {
		if (!this.provider || amountIn === '') {
			return
		}
		if (!(await this.fromInput.validate())) {
			this.swapEnabled = false
			this.swapLabel = this.fromInput.errorMessage
			this.swapButtonClass = 'swap-button-error'
			this.swapButtonTextColor = 'negative'
			this.swapButtonBackgroundColor = 'light-secondary'
			return
		}
		try {
			// check allowance for 0x Exchange Proxy
			const token = IERC20__factory.connect(this.from.token.address, this.provider)
			const allowance: BigNumber = await token.allowance(this.user, DEXUtils.get0xExchangeRouterAddress())
			let skipValidation = false
			if (allowance.lt(ethers.utils.parseUnits(this.from.amount, this.from.token.decimals))) {
				this.approveLabel = `Approve ${this.from.token.symbol}`
				this.swapEnabled = false
				skipValidation = true
				console.error(
					`Allowance is not high enough: ${ethers.utils.formatUnits(allowance, this.from.token.decimals)} ${
						this.from.token.symbol
					} but ${this.from.amount} ${this.from.token.symbol} required`
				)
			}
			// get gas price from tracker
			this.gasPrice = await Networks.getSuggestedTransactionGasPriceInGwei()
			// get quote from 0x
			this.quote = await DEXUtils.getQuote(
				{
					user: this.user,
					from: this.from,
					to: this.to.token,
					gasPrice: this.gasPrice,
				},
				skipValidation
			)
			this.gas = this.quote.gas
			this.gasPrice = this.quote.gasPrice
			console.debug(`Gas price: ${ethers.utils.formatUnits(this.gasPrice, 'gwei')} gwei`)
			console.debug(`Gas limit: ${this.gas}`)
			this.from.amount = amountIn
			this.to.amount = this.quote.to.amount
			// check if there is an allowance needed
			if (skipValidation) {
				this.approveLabel = `Approve ${this.from.token.symbol}`
				this.swapEnabled = false
			} else {
				this.approveLabel = ''
				this.swapEnabled = true
				this.swapLabel = 'Swap'
				this.swapButtonClass = ''
				this.swapButtonTextColor = 'secondary'
				this.swapButtonBackgroundColor = 'primary'
			}
		} catch (err) {
			console.error(err)
			this.swapEnabled = false
			this.swapLabel = this.fromInput.errorMessage
			this.swapButtonClass = 'swap-button-error'
			this.swapButtonTextColor = 'negative'
			this.swapButtonBackgroundColor = 'light-secondary'
		}
	}

	async approve() {
		if (!this.provider) {
			throw new Error('Missing Web3 provider')
		}
		// approve `allowanceTarget` to spend the tokens
		const signer: Signer = this.provider.getSigner()
		const token = IERC20__factory.connect(this.from.token.address, signer)
		let amount = ethers.utils.parseUnits(this.from.amount, this.from.token.decimals)
		if (this.allowanceSetting === 'unlimited') {
			amount = BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
		}
		try {
			SwapDialogs.startTokenApproval()
			const approveTxn = await token.approve(this.quote.allowanceTarget, amount)
			await approveTxn.wait(2)
			// check that allowance is enough now
			await this.checkAllowance(approveTxn.hash, this.quote.allowanceTarget, this.user, token, amount)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error.code === Logger.errors.TRANSACTION_REPLACED) {
				if (error.repriced) {
					console.warn('Transaction was repriced by the user')
					await this.checkAllowance(error.replacement.hash, this.quote.allowanceTarget, this.user, token, amount)
				} else if (error.cancelled) {
					console.error('Transaction was cancelled by the user')
				} else {
					// The user used "speed up" or something similar in their client, but we now have the updated info
					// `error.replacement` is the new txn and `error.receipt` the new txn receipt
					console.warn('The transaction was most likely speed up')
					await error.replacement.wait(2)
					await this.checkAllowance(error.replacement.hash, this.quote.allowanceTarget, this.user, token, amount)
				}
			}
			console.error(error)
			SwapDialogs.errorTokenApproval()
			throw new Error(`Can't approve ${this.quote.allowanceTarget} to spend ${this.from.token.symbol}`)
		}
	}

	async swap() {
		if (!this.provider) {
			return
		}
		// send the transaction
		const txn: TransactionRequest = {
			to: this.quote.txnTo,
			gasLimit: this.quote.gas,
			gasPrice: this.quote.gasPrice,
			data: this.quote.txnData,
			// chainId: this.expectedBlockchain.chainIdNumber,
		}
		const signer: Signer = this.provider.getSigner()
		SwapDialogs.startSwap()
		try {
			const txnResponse = await signer.sendTransaction(txn)
			await txnResponse.wait(2)
			const txnHash = txnResponse.hash
			const blockchainExplorerUrl = Accounts.network.blockExplorerUrls[0]
			const txnLink = `${blockchainExplorerUrl}/tx/${txnHash}`
			SwapDialogs.confirmSwap(txnHash, txnLink)
			this.from.amount = ''
			this.to.amount = ''
			this.quote = EMPTY_QUOTE
			this.swapEnabled = false
			this.swapInProgress = false
		} catch (err) {
			SwapDialogs.errorSwap()
		}
	}

	/**
	 * Checks if the allowance of `allowanceTarget` is at least `amount` for token `token`.
	 */
	private async checkAllowance(
		txnHash: string,
		allowanceTarget: string,
		owner: string,
		token: IERC20,
		amount: BigNumber
	) {
		// check that allowance is enough now
		const allowance: BigNumber = await token.allowance(owner, allowanceTarget)
		if (allowance.lt(amount)) {
			console.error(
				`Allowance is not high enough: ${ethers.utils.formatUnits(allowance, this.from.token.decimals)} ${
					this.from.token.symbol
				} but ${this.from.amount} ${this.from.token.symbol} required`
			)
			this.approveLabel = `Approve ${this.from.token.symbol}`
		} else {
			console.debug('Allowance is good enough for the swap')
			// give feedback to the user
			const blockchainExplorerUrl = Accounts.network.blockExplorerUrls[0]
			const txnLink = `${blockchainExplorerUrl}/tx/${txnHash}`
			SwapDialogs.confirmTokenApproval(txnHash, txnLink)
			// update form
			this.approveLabel = ''
			this.swapEnabled = true
			this.swapLabel = 'Swap'
			this.swapButtonClass = ''
			this.swapButtonTextColor = 'secondary'
			this.swapButtonBackgroundColor = 'primary'
			// refresh quote
			this.getSwapQuote(this.from.amount)
		}
	}

	resetValidation() {
		this.fromInput.resetValidation()
	}

	async onProviderChange() {
		await TokensUtil.loadTokensList()
		// load tokens list
		await TokensUtil.loadTokensList()
		const wban = await TokensUtil.getTokenBySymbol('wBAN')
		if (wban) {
			Object.assign(this.from.token, wban)
		}
		const usdc = await TokensUtil.getTokenBySymbol('USDC')
		if (usdc) {
			Object.assign(this.to.token, usdc)
		}
		this.fromInput.amountField.focus()
		this.resetValidation()
	}

	async mounted() {
		this.onProviderChange()
		document.addEventListener('web3-connection', this.onProviderChange)
	}

	unmounted() {
		document.removeEventListener('web3-connection', this.onProviderChange)
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.swaps
	margin-left: auto
	margin-right: auto
	max-width: 500px

.token-input
	margin-left: 0

#swap-icon
	position: relative
	text-align: center
	margin-left: 0
	margin-top: -1 * $space-base
	margin-bottom: -1.5 * $space-base
	button
		border: 1px solid
		border-color: $secondary
		background-color: lighten($secondary, 10%) !important

.swap-details, .swap-route
	margin-top: $space-base
	margin-left: 0
	font-size: 14px !important
	.section-title
		font-weight: 300
		margin-bottom: 0.5 * $space-base
	.q-item
		padding: 0
		min-height: 24px

.swap-actions
	margin-left: 0
	button
		margin-top: 0.5 * $space-base
		width: 100%
	.swap-button-error .q-btn__content
		font-weight: bold

.q-btn-group
	background-color: lighten($secondary, 10%)
	padding: 3px
	outline: 1px solid $primary
	margin-right: 4px
	> .q-btn-item:first-child, > .q-btn-item:not(:first-child)
		border-radius: 28px

body.body--dark .swap-details
	border-color: $primary

body.body--dark #swap-icon
	color: $primary
</style>
