<template>
	<q-dialog ref="dialog" @hide="onDialogHide">
		<q-card class="q-dialog-plugin">
			<q-card-section class="row items-center">
				<div class="text-h6">{{ $t('withdraw') }}</div>
				<q-space />
				<q-btn icon="close" flat round dense v-close-popup color="white" />
			</q-card-section>
			<q-card-section>
				<div>{{ $t('withdraw') }}</div>
				<token-input
					:label="$t('components.farm.farm')"
					:currency="lpSymbol"
					:balance="lpStakedBalance"
					:decimals="18"
					:amount.sync="lpStakedAmount"
					editable
				/>
			</q-card-section>
			<q-card-section v-if="!userHasLiquidityTokens">
				<div class="border-left">
					{{ $t('components.farm.zap-out-hint', { symbol1: token1Symbol, symbol2: token2Symbol }) }}
				</div>
			</q-card-section>
			<q-card-section align="right">
				<q-btn @click="withdraw" color="primary" text-color="secondary" :label="$t('withdraw')" />
			</q-card-section>
			<q-card-section v-if="userHasLiquidityTokens">
				<div>{{ $t('components.farm.zap-out-to-symbol', { symbol: token.symbol }) }}</div>
				<token-input
					@input="selectToken"
					:label="lpSymbol"
					:currency="lpSymbol"
					:balance="lpBalance"
					:decimals="18"
					:amount.sync="lpAmount"
					editable
				>
					<template v-slot:prepend>
						<q-select
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
								<span class="symbol">{{ token.symbol }}</span>
							</template>
						</q-select>
					</template>
				</token-input>
			</q-card-section>
			<q-card-section v-if="userHasLiquidityTokens" align="right">
				<q-btn @click="zapOut" color="primary" text-color="secondary" :label="$t('components.farm.button-zap-out')" />
			</q-card-section>
		</q-card>
	</q-dialog>
</template>

<script lang="ts">
import { getZapAddress } from '@/config/constants/farms'
import { Address, FarmConfig } from '@/config/constants/types'
import { Benis, ERC20PermitUpgradeable__factory } from '@artifacts/typechain'
import { WBANFarmZap, WBANFarmZap__factory } from 'wban-zaps'
import { ethers, providers, Signature, Signer } from 'ethers'
import { Component, Ref, Prop, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import BenisUtils from '@/utils/BenisUtils'
import BEP20Utils from '@/utils/BEP20Utils'
import Dialogs from '@/utils/Dialogs'
import { Network } from '@/utils/Networks'
import { formatEther, parseEther } from 'ethers/lib/utils'
import PermitUtil from '@/utils/PermitUtil'
import TokenInput from '@/components/farms/TokenInput.vue'
import TokensUtil from '@/utils/TokensUtil'
import plausible from '@/store/modules/plausible'

const benisStore = namespace('benis')
const accountsStore = namespace('accounts')

@Component({
	components: {
		TokenInput,
	},
})
export default class FarmWithdrawDialog extends Vue {
	@Prop({ type: Object, required: true }) farm!: FarmConfig
	@Prop({ type: Object, required: true }) signer!: Signer

	@benisStore.Getter('benisContract')
	benis!: Benis

	@accountsStore.State('activeAccount')
	account!: string

	@accountsStore.State('network')
	network!: Network

	lpSymbol = ''
	lpStakedBalance = ethers.constants.Zero
	lpStakedAmount = ''
	lpBalance = ethers.constants.Zero
	lpAmount = ''
	token = { symbol: '', address: '', zap: false }
	token1Symbol = ''
	token2Symbol = ''
	farmTokens: Array<{ symbol: string; address: string; zap: boolean }> = []

	private bep20 = new BEP20Utils()
	private benisUtils = new BenisUtils()

	@Ref('dialog')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private dialog: any

	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	async withdraw() {
		const txnHash = await this.benisUtils.withdraw(this.farm.pid, this.lpStakedAmount, this.farm.lpSymbol, this.benis)
		this.trackEventInPlausible('Farms: Withdraw')
		const blockExplorerUrl = this.network.blockExplorerUrls[0]
		Dialogs.confirmFarmWithdraw(this.lpStakedAmount, this.farm.lpSymbol, txnHash, `${blockExplorerUrl}/tx/${txnHash}`)
		await this.selectToken()
		this.$emit('farm-withdraw', txnHash)
	}

	async zapOut() {
		const zap: WBANFarmZap = WBANFarmZap__factory.connect(getZapAddress(), this.signer)
		const amountToZap = parseEther(this.lpAmount)

		const lpAddress = this.farm.lpAddresses[FarmWithdrawDialog.ENV_NAME as keyof Address]
		const erc20 = await ERC20PermitUpgradeable__factory.connect(lpAddress, this.signer)
		const nonce = await erc20.nonces(this.account)
		const deadline = Date.now() + 30 * 60 * 1_000 // 30 minutes
		const sig: Signature = await PermitUtil.createPermitSignatureForToken(
			await erc20.name(),
			'1',
			lpAddress,
			this.signer as providers.JsonRpcSigner,
			zap.address,
			amountToZap,
			nonce,
			deadline
		)
		const weth = await TokensUtil.getTokenBySymbol('WETH')
		if (!weth) {
			console.error("Can't find WETH")
			return
		}
		const tokenAddress = this.token.address ? this.token.address : weth[0].address
		const tx = await zap.zapOutToTokenWithPermit(
			amountToZap,
			tokenAddress,
			0, // TODO: find a way to get a better estimate,
			deadline,
			sig.v,
			sig.r,
			sig.s
		)
		this.trackEventInPlausible('Farms: Zap out', {
			to: this.token.address ? this.token.symbol : this.network.nativeCurrency,
		})
		Dialogs.startFarmZapProgress(this.lpAmount, this.lpSymbol)
		await tx.wait()
		const blockExplorerUrl = this.network.blockExplorerUrls[0]
		Dialogs.confirmFarmZapOut(this.lpAmount, this.lpSymbol, tx.hash, `${blockExplorerUrl}/tx/${tx.hash}`)
		this.hide()
	}

	get userHasLiquidityTokens(): boolean {
		return !this.lpBalance.isZero()
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

	async selectToken() {
		// staked balance
		this.lpStakedBalance = await this.benisUtils.getStakedBalance(this.farm.pid, this.account, this.benis)
		if (!this.lpStakedBalance.isZero()) {
			this.lpStakedAmount = formatEther(this.lpStakedBalance)
		}
		// LP balance
		const lpAddress = this.farm.lpAddresses[FarmWithdrawDialog.ENV_NAME as keyof Address]
		this.lpSymbol = this.farm.lpSymbol
		this.lpBalance = await this.bep20.getTokenBalance(this.account, lpAddress, this.signer)
		if (!this.lpBalance.isZero()) {
			this.lpAmount = formatEther(this.lpBalance)
		}
	}

	private trackEventInPlausible(name: string, customProps = {}) {
		plausible.trackEvent(name, {
			props: {
				network: this.network.chainName,
				farm: `${this.token1Symbol}-${this.token2Symbol}`,
				...customProps,
			},
		})
	}

	async mounted() {
		plausible.init()

		const tokenAddress = this.farm.token.address
			? this.farm.token.address[FarmWithdrawDialog.ENV_NAME as keyof Address]
			: ''
		const quoteTokenAddress = this.farm.quoteToken.address
			? this.farm.quoteToken.address[FarmWithdrawDialog.ENV_NAME as keyof Address]
			: ''

		this.farmTokens = [
			{ symbol: this.farm.token.symbol, address: tokenAddress, zap: true },
			{ symbol: this.farm.quoteToken.symbol, address: quoteTokenAddress, zap: true },
		]
		this.token = this.farmTokens[0]
		this.token1Symbol = this.farm.token.symbol
		this.token2Symbol = this.farm.quoteToken.symbol
		await this.selectToken()
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
	margin-bottom: 1em
	padding-left: 1em
	border-left: 2px solid $primary

.q-dialog-plugin
	a
		color: $primary

@media (min-width: $breakpoint-sm-min)
	.q-dialog-plugin
		min-width: 500px
</style>
