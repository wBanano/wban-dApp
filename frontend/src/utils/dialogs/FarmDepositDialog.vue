<template>
	<q-dialog ref="dialog" @hide="onDialogHide">
		<q-card class="q-dialog-plugin">
			<q-card-section class="row items-center">
				<div class="text-h6">{{ $t('components.farm.button-deposit') }}</div>
				<q-space />
				<q-btn icon="close" flat round dense v-close-popup color="white" />
			</q-card-section>
			<q-card-section>
				<token-input
					:label="token.symbol"
					:currency="token.symbol"
					:balance="balance"
					:decimals="decimals"
					:amount.sync="amount"
					editable
					:dense="$q.platform.is.mobile"
				>
					<template v-slot:prepend>
						<q-select
							@input="selectToken"
							v-model="token"
							:options="farmTokens"
							option-value="address"
							option-label="symbol"
							map-options
							dense
							borderless
							class="token"
						>
							<template v-slot:selected>
								<span class="symbol">
									<span v-if="token.zap">
										{{ $t('components.farm.zap-in-from', { symbol: token.symbol }) }}
									</span>
									<span v-else>
										{{ token.symbol }}
									</span>
								</span>
							</template>
						</q-select>
					</template>
				</token-input>
			</q-card-section>
			<q-card-section>
				<div v-if="!token.zap">
					<div class="border-left">
						You can
						<a @click="addLiquidity" color="primary">
							{{ $t('components.farm.button-add-liquidity') }}
						</a>
						straight from the DEX, or zap in from any token of the liquidity pool and then deposit your liquidity pool
						tokens in the farm.
					</div>
					<div>{{ $t('components.farm.button-deposit-tooltip') }}</div>
				</div>
				<div class="border-left" v-else>
					{{ $t('components.farm.zap-in-process-phrase1') }}
					<ol>
						<li>{{ $t('components.farm.zap-in-process-phrase2', { symbol: token.symbol }) }}</li>
						<li>{{ $t('components.farm.zap-in-process-phrase3') }}</li>
					</ol>
				</div>
			</q-card-section>
			<q-card-actions align="right">
				<q-btn flat :label="$t('cancel')" color="primary" v-close-popup />
				<q-btn @click="zapOrDeposit" color="primary" text-color="secondary" :label="submitLabel" />
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>

<script lang="ts">
import { getZapAddress, hasPermitFeature } from '@/config/constants/farms'
import { Address, FarmConfig } from '@/config/constants/types'
import { Benis, ERC20PermitUpgradeable__factory } from '@artifacts/typechain'
import { WBANFarmZap, WBANFarmZap__factory } from 'wban-zaps'
import { BigNumber, ethers, providers, Signature, Signer } from 'ethers'
import { Component, Ref, Prop, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import BenisUtils from '@/utils/BenisUtils'
import BEP20Utils from '@/utils/BEP20Utils'
import Dialogs from '@/utils/Dialogs'
import { Network } from '@/utils/Networks'
import { formatEther, formatUnits, parseUnits } from 'ethers/lib/utils'
import PermitUtil from '@/utils/PermitUtil'
import TokenInput from '@/components/farms/TokenInput.vue'
import i18n from '@/i18n'
import { getDexUrl } from '@/config/constants/dex'
import { openURL } from 'quasar'
import TokensUtil from '@/utils/TokensUtil'
import plausible from '@/store/modules/plausible'

const benisStore = namespace('benis')
const accountsStore = namespace('accounts')
const contractsStore = namespace('contracts')

@Component({
	components: {
		TokenInput,
	},
})
export default class FarmDepositDialog extends Vue {
	@Prop({ type: Object, required: true }) farm!: FarmConfig
	@Prop({ type: Object, required: true }) signer!: Signer

	@benisStore.Getter('benisContract')
	benis!: Benis

	@contractsStore.Getter('wbanAddress')
	wbanAddress!: string

	@accountsStore.State('activeAccount')
	account!: string

	@accountsStore.State('network')
	network!: Network

	token = { symbol: '', address: '', zap: false }
	balance = ethers.constants.Zero
	decimals = 18
	amount = ''
	farmTokens: Array<{ symbol: string; address: string; zap: boolean }> = []

	private bep20 = new BEP20Utils()
	private benisUtils = new BenisUtils()

	@Ref('dialog')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private dialog: any

	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	async zapOrDeposit() {
		if (this.token.zap) {
			await this.zapIn()
		} else {
			await this.deposit()
		}
	}

	async deposit() {
		let txnHash = ''
		// check if Benis has permit feature
		const permitEnabled = hasPermitFeature()
		console.debug('Is Benis permit enabled?', permitEnabled)
		if (permitEnabled) {
			txnHash = await this.benisUtils.depositWithPermit(
				this.farm.pid,
				this.farm.lpAddresses[FarmDepositDialog.ENV_NAME as keyof Address],
				this.amount,
				this.farm.lpSymbol,
				this.signer,
				this.benis
			)
		} else {
			txnHash = await this.benisUtils.deposit(this.farm.pid, this.amount, this.farm.lpSymbol, this.benis)
		}
		this.trackEventInPlausible('Farms: Deposit')
		const blockExplorerUrl = this.network.blockExplorerUrls[0]
		Dialogs.confirmFarmDeposit(this.amount, this.farm.lpSymbol, txnHash, `${blockExplorerUrl}/tx/${txnHash}`)
		this.hide()
		this.$emit('farm-supply', txnHash)
	}

	async zapIn() {
		const zap: WBANFarmZap = WBANFarmZap__factory.connect(getZapAddress(), this.signer)
		const amountToZap = parseUnits(this.amount, this.decimals)

		let swapAmountOut: BigNumber = ethers.constants.Zero
		if (this.token.address) {
			const [, _swapAmountOut] = await zap.estimateSwap(this.token.address, amountToZap)
			swapAmountOut = _swapAmountOut
		} else {
			const weth = await TokensUtil.getTokenBySymbol('WETH')
			if (!weth) {
				console.error("Can't find WETH")
				return
			}
			const [, _swapAmountOut] = await zap.estimateSwap(weth[0].address, amountToZap)
			swapAmountOut = _swapAmountOut
		}
		console.info('Estimated output:', formatEther(swapAmountOut), 'wBAN from ', this.amount, this.token.symbol)

		if (this.token.address) {
			const erc20 = await ERC20PermitUpgradeable__factory.connect(this.token.address, this.signer)
			let permitEnabled = true
			let tx = undefined
			let nonce = undefined
			try {
				nonce = await erc20.nonces(this.account)
				permitEnabled = true
			} catch (err: unknown) {
				permitEnabled = false
			}
			if (permitEnabled) {
				const deadline = Date.now() + 30 * 60 * 1_000 // 30 minutes
				const sig: Signature = await PermitUtil.createPermitSignatureForToken(
					await erc20.name(),
					'1',
					this.token.address,
					this.signer as providers.JsonRpcSigner,
					zap.address,
					amountToZap,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					nonce!,
					deadline
				)
				tx = await zap.zapInFromTokenWithPermit(
					this.token.address,
					amountToZap,
					swapAmountOut, //swapAmountOut.mul(9998).div(1000), // 0.2% slippage
					deadline,
					sig.v,
					sig.r,
					sig.s
				)
			} else {
				console.warn('no permit feature for', this.token.address)
				tx = await erc20.approve(zap.address, amountToZap)
				await tx.wait()
				tx = await zap.zapInFromToken(
					this.token.address,
					amountToZap,
					swapAmountOut //swapAmountOut.mul(9998).div(1000), // 0.2% slippage
				)
			}
			this.trackEventInPlausible('Farms: Zap in', {
				from: this.token.address ? this.token.symbol : this.network.nativeCurrency,
			})
			Dialogs.startFarmZapProgress(this.amount, this.token.symbol)
			await tx.wait()
			const blockExplorerUrl = this.network.blockExplorerUrls[0]
			Dialogs.confirmFarmZapIn(this.amount, this.token.symbol, tx.hash, `${blockExplorerUrl}/tx/${tx.hash}`)
		} else {
			const tx = await zap.zapInFromETH(swapAmountOut, { value: amountToZap })
			await tx.wait()
		}
		// switch to LP token deposit mode
		this.token = this.farmTokens[0]
		await this.selectToken()
	}

	addLiquidity() {
		if (this.farm.quoteToken.address) {
			const otherToken = this.farm.quoteToken.address[FarmDepositDialog.ENV_NAME as keyof Address]
			if (getDexUrl() === 'https://app.sushi.com/legacy' || getDexUrl() === 'https://pancakeswap.finance') {
				openURL(`${getDexUrl()}/add/${this.wbanAddress}/${otherToken}?chainId=${this.network.chainIdNumber}`)
			} else if (getDexUrl() === 'https://app.uniswap.org') {
				openURL(`${getDexUrl()}/#/add/v2/${this.wbanAddress}/${otherToken}`)
			} else {
				openURL(`${getDexUrl()}/#/add/${this.wbanAddress}/${otherToken}`)
			}
		} else {
			if (getDexUrl() === 'https://app.sushi.com/legacy' || getDexUrl() === 'https://pancakeswap.finance') {
				openURL(`${getDexUrl()}/add/${this.wbanAddress}/ETH?chainId=${this.network.chainIdNumber}`)
			} else if (getDexUrl() === 'https://app.uniswap.org') {
				openURL(`${getDexUrl()}/#/add/v2/${this.wbanAddress}/ETH`)
			} else {
				openURL(`${getDexUrl()}/#/add/${this.wbanAddress}/ETH`)
			}
		}
	}

	async selectToken() {
		if (this.token.address) {
			this.balance = await this.bep20.getTokenBalance(this.account, this.token.address, this.signer)
			const token = await this.bep20.getBEP20Token(this.token.address, this.signer)
			this.decimals = await token.decimals()
			if (this.balance.isZero()) {
				this.amount = ''
			} else {
				this.amount = formatUnits(this.balance, this.decimals)
			}
		} else {
			this.balance = await this.signer.getBalance()
			this.decimals = 18
			if (this.balance.isZero()) {
				this.amount = ''
			} else {
				this.amount = formatEther(await this.signer.getBalance())
			}
		}
	}

	private trackEventInPlausible(name: string, customProps = {}) {
		plausible.trackEvent(name, {
			props: {
				network: this.network.chainName,
				farm: `${this.farmTokens[1].symbol}-${this.farmTokens[2].symbol}`,
				...customProps,
			},
		})
	}

	get submitLabel() {
		if (this.token.zap) {
			return i18n.t('components.farm.button-zap-in')
		} else {
			return i18n.t('components.farm.button-deposit')
		}
	}

	show() {
		this.dialog.show()
	}

	hide() {
		this.dialog.hide()
	}

	onDialogHide() {
		// required to be emitted
		// when QDialog emits "hide" event
		this.$emit('hide')
	}

	onOKClick() {
		// on OK, it is REQUIRED to
		// emit "ok" event (with optional payload)
		// before hiding the QDialog
		this.$emit('ok')
		// or with payload: this.$emit('ok', { ... })

		// then hiding dialog
		this.hide()
	}

	onCancelClick() {
		this.hide()
	}

	async mounted() {
		plausible.init()

		const lpAddress = this.farm.lpAddresses[FarmDepositDialog.ENV_NAME as keyof Address]
		const tokenAddress = this.farm.token.address
			? this.farm.token.address[FarmDepositDialog.ENV_NAME as keyof Address]
			: ''
		const quoteTokenAddress = this.farm.quoteToken.address
			? this.farm.quoteToken.address[FarmDepositDialog.ENV_NAME as keyof Address]
			: ''

		this.farmTokens = [
			{ symbol: `${this.farm.lpSymbol} LP`, address: lpAddress, zap: false },
			{ symbol: this.farm.token.symbol, address: tokenAddress, zap: true },
			{ symbol: this.farm.quoteToken.symbol, address: quoteTokenAddress, zap: true },
		]
		this.token = this.farmTokens[0]
		await this.selectToken()
		if (!this.balance.isZero()) {
			this.amount = formatUnits(
				this.balance,
				await (await this.bep20.getBEP20Token(this.token.address, this.signer)).decimals()
			)
		}
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.token
	background-color: lighten($secondary, 5%)
	.symbol
		color: $primary
		width: 100%

body.mobile
	.symbol
		text-align: center

body.desktop
	.symbol
		text-align: right

.border-left
	border-left: 2px solid $primary
	margin-bottom: 1em
	padding-left: 1em
	a
		cursor: pointer
	ol
		margin-block-start: 0
		padding-inline-start: 20px

.q-dialog-plugin
	button
		color: $primary

@media (min-width: $breakpoint-sm-min)
	.q-dialog-plugin
		min-width: 500px
</style>
