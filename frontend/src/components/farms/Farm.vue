<template>
	<div class="col-xl-3 col-lg-3 col-md-4 col-sm-8 col-xs-12 flex">
		<q-card class="farm-card fit text-white">
			<q-item>
				<q-item-section>
					<q-item-label>{{ value.lpSymbol }}</q-item-label>
				</q-item-section>
				<q-item-section side>
					<q-item-label>APR: {{ apr }}%</q-item-label>
				</q-item-section>
			</q-item>
			<q-separator class="bg-secondary" />
			<q-card-section>
				<div class="rewards">
					<div class="title">wBAN Earned</div>
					<div class="row items-center">
						<div class="col-8">
							{{ pendingRewards | bnToTwoDecimalsString }} ({{ pendingRewards | bnToExactString | banPrice }})
						</div>
						<div class="col-4 text-right">
							<q-btn label="Harvest" @click="harvest" :disable="emptyRewards" color="primary" text-color="secondary" />
						</div>
					</div>
				</div>
			</q-card-section>
			<q-expansion-item label="Details" class="text-right">
				<q-card class="farm-details">
					<q-card-section class="text-right">
						<div>Time left: {{ timeLeft }}</div>
						<div>TVL: ${{ tvl | bnToTwoDecimalsStringFilter }}</div>
					</q-card-section>
				</q-card>
			</q-expansion-item>
			<q-separator class="bg-secondary" />
			<q-card-actions class="farm-actions">
				<q-btn @click="approve" v-if="!lpTokenAllowance" color="primary" class="fit" flat>Approve</q-btn>
				<q-btn-group outline spread class="fit">
					<q-btn @click="beginSupply" v-if="lpTokenAllowance" color="primary" flat>Supply</q-btn>
					<q-btn
						@click="beginWithdraw"
						v-if="lpTokenAllowance"
						:disable="lpStakedTokenBalance.isZero()"
						color="primary"
						flat
					>
						Withdraw
					</q-btn>
				</q-btn-group>
			</q-card-actions>
		</q-card>
		<q-dialog v-model="promptForSupply" persistent>
			<q-card>
				<q-card-section>
					<div class="text-h6">Supply</div>
				</q-card-section>
				<q-card-section>
					<token-input
						:label="value.lpSymbol"
						:currency="value.lpSymbol"
						:balance="lpTokenBalance"
						:amount.sync="lpAmount"
						editable
					/>
				</q-card-section>
				<q-card-actions align="right">
					<q-btn flat label="Cancel" color="primary" v-close-popup />
					<q-btn @click="supply" color="primary" text-color="secondary" label="Supply" v-close-popup />
				</q-card-actions>
			</q-card>
		</q-dialog>
		<q-dialog v-model="promptForWithdraw" persistent>
			<q-card>
				<q-card-section>
					<div class="text-h6">Withdraw</div>
				</q-card-section>
				<q-card-section>
					<token-input
						:label="value.lpSymbol"
						:currency="value.lpSymbol"
						:balance="lpStakedTokenBalance"
						:amount.sync="lpAmount"
						editable
					/>
				</q-card-section>
				<q-card-actions align="right">
					<q-btn flat label="Cancel" color="primary" v-close-popup />
					<q-btn @click="withdraw" color="primary" text-color="secondary" label="Withdraw" v-close-popup />
				</q-card-actions>
			</q-card>
		</q-dialog>
	</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import TokenInput from '@/components/farms/TokenInput.vue'
import ban from '@/store/modules/ban'
import BenisUtils from '@/utils/BenisUtils'
import BEP20Utils from '@/utils/BEP20Utils'
import { BigNumber, Signer, ethers } from 'ethers'
import { Benis } from '../../../../artifacts/typechain'
import { FarmConfig, Address } from '@/config/constants/types'
import tokens from '@/config/constants/tokens'
import { bnToTwoDecimalsStringFilter, bnToExactStringFilter } from '@/utils/filters'
import Dialogs from '@/utils/Dialogs'

const benisStore = namespace('benis')
const accountsStore = namespace('accounts')
const pricesStore = namespace('prices')

@Component({
	components: {
		TokenInput
	},
	filters: {
		bnToTwoDecimalsStringFilter,
		bnToExactStringFilter
	}
})
export default class Farm extends Vue {
	@Prop({ type: Object, required: true }) value!: FarmConfig
	@Prop({ type: String, required: true }) account!: string

	@accountsStore.Getter('providerEthers')
	provider!: ethers.providers.JsonRpcProvider | null

	@accountsStore.State('blockExplorerUrl')
	blockExplorerUrl!: string

	@benisStore.Getter('benisContract')
	benis!: Benis

	@pricesStore.Getter('prices')
	prices!: Map<string, number>

	pendingRewards = BigNumber.from(0)
	emptyRewards = true
	timeLeft = ''
	tvl = BigNumber.from(0)

	apr = 0
	lpTokenAllowance = false
	lpTokenBalance = BigNumber.from('0')
	lpStakedTokenBalance = BigNumber.from('0')
	lpAmount = '0'

	promptForSupply = false
	promptForWithdraw = false

	signer!: Signer
	benisUtils = new BenisUtils()
	bep20 = new BEP20Utils()

	wbanAddress: string = tokens.wban.address[Farm.ENV_NAME as keyof Address]

	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''
	static BENIS_CONTRACT_ADDRESS: string = process.env.VUE_APP_BENIS_CONTRACT || ''

	async approve() {
		await this.bep20.approve(this.value.lpAddresses[Farm.ENV_NAME as keyof Address], this.signer)
		await this.reload()
	}

	async beginSupply() {
		this.lpTokenBalance = await this.bep20.getLPBalance(
			this.account,
			this.value.lpAddresses[Farm.ENV_NAME as keyof Address],
			this.signer
		)
		console.debug(`LP token balance: ${ethers.utils.formatEther(this.lpTokenBalance)}`)
		this.lpAmount = ''
		this.promptForSupply = true
	}

	async supply() {
		const txnHash = await this.benisUtils.supply(this.value.pid, this.lpAmount, this.value.lpSymbol, this.benis)
		await this.reload()
		Dialogs.confirmFarmSupply(this.lpAmount, this.value.lpSymbol, txnHash, `${this.blockExplorerUrl}/tx/${txnHash}`)
		this.promptForSupply = false
	}

	async beginWithdraw() {
		this.lpStakedTokenBalance = await this.benisUtils.getStakedBalance(this.value.pid, this.account, this.benis)
		console.debug(`Staked balance: ${ethers.utils.formatEther(this.lpStakedTokenBalance)}`)
		this.lpAmount = ''
		this.promptForWithdraw = true
	}

	async withdraw() {
		const txnHash = await this.benisUtils.withdraw(this.value.pid, this.lpAmount, this.value.lpSymbol, this.benis)
		await this.reload()
		Dialogs.confirmFarmWithdraw(this.lpAmount, this.value.lpSymbol, txnHash, `${this.blockExplorerUrl}/tx/${txnHash}`)
		this.promptForWithdraw = false
	}

	async harvest() {
		await this.benisUtils.harvest(this.value.pid, this.benis)
		await this.reload()
	}

	async reload() {
		if (this.provider) {
			this.signer = this.provider.getSigner()

			this.apr = await this.computeAPR(this.signer)

			const allowance: BigNumber = await this.bep20.allowance(
				this.account,
				this.value.lpAddresses[Farm.ENV_NAME as keyof Address],
				this.signer
			)
			this.lpTokenAllowance = allowance.gt(BigNumber.from('0'))
			this.lpStakedTokenBalance = await this.benisUtils.getStakedBalance(this.value.pid, this.account, this.benis)
			this.pendingRewards = await this.benisUtils.getPendingRewards(this.value.pid, this.account, this.benis)
			this.emptyRewards = this.pendingRewards.isZero()
			this.timeLeft = this.benisUtils.getFarmDurationLeft(this.value.pid, Farm.ENV_NAME)
			console.debug(`Time left: ${this.timeLeft}`)
		}
	}

	private async computeAPR(signer: Signer): Promise<number> {
		console.debug(`Computing APR for ${this.value.lpSymbol}`)

		const wbanPriceUsd = ethers.utils.parseEther(ban.banPriceInUSD.toString())

		let poolLiquidityUsd = BigNumber.from(0)
		if (this.wbanAddress === this.value.lpAddresses[Farm.ENV_NAME as keyof Address]) {
			const pool = await this.benis.poolInfo(this.value.pid)
			const wbanLiquidity: BigNumber = pool.stakingTokenTotalAmount
			console.debug(`Benis is hodling ${ethers.utils.formatEther(wbanLiquidity)} wBAN`)
			poolLiquidityUsd = wbanLiquidity.mul(wbanPriceUsd).div(ethers.utils.parseEther('1'))
		} else {
			const lpDetails = await this.bep20.getLPDetails(this.value.lpAddresses[Farm.ENV_NAME as keyof Address], signer)

			const priceToken0: number = await this.getTokenPriceUsd(lpDetails.token0.address, signer)
			const priceToken1: number = await this.getTokenPriceUsd(lpDetails.token1.address, signer)
			const symbolToken0: string = await this.bep20.getTokenSymbol(lpDetails.token0.address, signer)
			const symbolToken1: string = await this.bep20.getTokenSymbol(lpDetails.token1.address, signer)
			console.debug(`Prices: token0 (${symbolToken0}): $${priceToken0}, token1 (${symbolToken1}): $${priceToken1}`)

			const liquidityToken0: BigNumber = lpDetails.token0.liquidity
			const liquidityToken1: BigNumber = lpDetails.token1.liquidity
			console.debug(
				`Liquidities: token0: ${ethers.utils.formatEther(liquidityToken0)}, token1: ${ethers.utils.formatEther(
					liquidityToken1
				)}`
			)
			const liquidityUsdToken0: BigNumber = liquidityToken0
				.mul(ethers.utils.parseEther(priceToken0.toString()))
				.div(ethers.utils.parseEther('1'))
			const liquidityUsdToken1: BigNumber = liquidityToken1
				.mul(ethers.utils.parseEther(priceToken1.toString()))
				.div(ethers.utils.parseEther('1'))
			console.debug(
				`Liquidities in USD: token0: $${ethers.utils.formatEther(
					liquidityUsdToken0
				)}, token1: $${ethers.utils.formatEther(liquidityUsdToken1)}`
			)
			poolLiquidityUsd = liquidityUsdToken0.add(liquidityUsdToken1)
		}

		this.tvl = poolLiquidityUsd
		console.debug(`Pool liquidity price: ${ethers.utils.formatEther(poolLiquidityUsd)}`)

		return this.benisUtils.getFarmAPR(this.value.pid, wbanPriceUsd, poolLiquidityUsd, this.benis)
	}

	private async getTokenPriceUsd(address: string, signer: Signer): Promise<number> {
		console.debug(`Fetching "${address}" token price`)
		const symbol = await this.bep20.getTokenSymbol(address, signer)
		// check if wBAN
		if (address === this.wbanAddress) {
			console.debug(`This is wBAN!!`)
			return ban.banPriceInUSD
		} else {
			const price = this.prices.get(symbol)
			if (price) {
				return price
			} else {
				throw new Error(`Can't find ${symbol} data at "${address}" for env "${Farm.ENV_NAME}"`)
			}
		}
	}

	async mounted() {
		this.reload()
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.farm-card
	background-color: lighten($secondary, 10%) !important
	.farm-actions, .farm-details
		background-color: lighten($secondary, 10%) !important
	.rewards
		border: 2px solid darken(white, 30%)
		border-radius: 12px
		padding: 10px
		.title
			font-weight: bold
			margin-bottom: 0.5em
</style>
