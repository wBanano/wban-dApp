<template>
	<div class="col-xl-3 col-lg-3 col-md-4 col-sm-8 col-xs-12 flex">
		<q-card v-if="isLoading" class="farm-card fit text-white">
			<q-item>
				<q-item-section>
					<q-item-label>
						<q-skeleton type="rect" />
					</q-item-label>
				</q-item-section>
			</q-item>
			<q-separator class="bg-secondary" />
			<q-card-section>
				<div class="rewards">
					<div class="title">wBAN Earned</div>
					<div class="row items-center">
						<div class="col-7">
							<q-skeleton type="rect" />
						</div>
						<div class="col-4 offset-1 text-right">
							<q-skeleton type="QBtn" />
						</div>
					</div>
				</div>
			</q-card-section>
			<q-card-section>
				<div class="row">
					<div class="col-2 text-right"><q-skeleton type="text" /></div>
					<div class="col-4 offset-1"><q-skeleton type="text" /></div>
					<div class="col-4 offset-1 text-right"><q-skeleton type="text" /></div>
				</div>
			</q-card-section>
			<q-separator class="bg-secondary" />
			<q-card-section>
				<div class="row justify-around">
					<div class="col-4"><q-skeleton type="QBtn" /></div>
					<div class="col-4"><q-skeleton type="QBtn" /></div>
					<div class="col-4"><q-skeleton type="QBtn" /></div>
				</div>
			</q-card-section>
		</q-card>
		<q-card v-if="!isLoading" class="farm-card fit text-white">
			<q-item>
				<q-item-section class="farm-name">
					<q-item-label class="text-bold">
						{{ value.lpSymbol }}
						<q-btn @click="reload" avatar flat dense icon="refresh" color="primary" size="xs" class="reload">
							<q-tooltip>Refresh</q-tooltip>
						</q-btn>
					</q-item-label>
				</q-item-section>
				<q-item-section side>
					<q-item-label v-if="isActive()" class="text-right text-bold">APR: {{ apr }}&nbsp;%</q-item-label>
					<q-item-label v-if="isFinished()" class="text-right text-primary">Farm Ended!</q-item-label>
				</q-item-section>
			</q-item>
			<q-separator class="bg-secondary" />
			<q-card-section>
				<div class="rewards">
					<div class="title">wBAN Earned<span v-if="isFinished()"> (withdraw to harvest)</span></div>
					<div class="row items-center">
						<div class="col-8 row items-center q-gutter-xs">
							<div class="col-auto">
								{{ farmData.userPendingRewards | bnToTwoDecimalsString }} ({{
									farmData.userPendingRewards | bnToExactString | banPrice
								}})
							</div>
						</div>
						<div class="col-4 text-right">
							<q-btn
								label="Harvest"
								@click="harvest"
								v-if="isActive()"
								:disable="emptyRewards"
								color="primary"
								text-color="secondary"
							/>
						</div>
					</div>
				</div>
			</q-card-section>
			<q-card-section>
				<div class="row">
					<div class="col-2 text-right">Deposit</div>
					<div class="col-5 offset-1">{{ farmData.stakedBalance | bnToSixDecimalsString }} {{ symbol }}</div>
					<div class="col-4 text-right">${{ farmData.stakedValue | bnToTwoDecimalsString }}</div>
				</div>
			</q-card-section>
			<q-expansion-item label="Details" class="text-right">
				<q-card class="farm-details">
					<q-card-section class="text-right">
						<div class="row">
							<div class="col-2 text-right">Deposit</div>
							<div class="col-5 offset-1">{{ farmData.stakedBalance | bnToSixDecimalsString }} {{ symbol }}</div>
							<div class="col-4 text-right">${{ farmData.stakedValue | bnToTwoDecimalsString }}</div>
						</div>

						<div class="row text-caption" v-if="!isStaking()">
							<div class="col-5 offset-3">
								{{ farmData.userPoolData.balanceToken0 | bnToSixDecimalsString }}
								{{ farmData.poolData.symbolToken0 }}
							</div>
							<div class="col-4 text-right">${{ depositValueToken0 | bnToTwoDecimalsString }}</div>
							<div class="col-5 offset-3">
								{{ farmData.userPoolData.balanceToken1 | bnToSixDecimalsString }}
								{{ farmData.poolData.symbolToken1 }}
							</div>
							<div class="col-4 text-right">${{ depositValueToken1 | bnToTwoDecimalsString }}</div>
						</div>

						<div class="row">
							<div class="col-2 text-right">Yield</div>
							<div class="col-5 offset-1">{{ farmData.userPendingRewards | bnToSixDecimalsString }} wBAN</div>
							<div class="col-4 text-right">{{ farmData.userPendingRewards | bnToExactString | banPrice }}</div>

							<div class="col-2 text-right">Total</div>
							<div class="col-5 offset-1">
								<span v-if="isStaking()">{{ farmData.userGlobalBalance | bnToSixDecimalsString }} wBAN</span>
							</div>
							<div class="col-4 text-right" v-if="isStaking()">
								{{ farmData.userGlobalBalance | bnToExactString | banPrice }}
							</div>
							<div class="col-4 text-right" v-if="!isStaking()">${{ farmData.totalValue | bnToTwoDecimalsString }}</div>
						</div>
						<div class="row q-mt-md">
							<div class="col-2 text-right">TVL</div>
							<div class="col-5 offset-1">
								<span v-if="isStaking()">
									{{ farmData.poolData.balanceToken0 | bnToZeroDecimalsStringFilter }} wBAN
								</span>
							</div>
							<div class="col-4 text-right">${{ farmData.poolData.tvl | bnToTwoDecimalsStringFilter }}</div>
						</div>
					</q-card-section>
				</q-card>
			</q-expansion-item>
			<q-separator class="bg-secondary" />
			<q-card-actions class="farm-actions">
				<q-btn @click="approve" v-if="!lpTokenAllowance" color="primary" class="fit" flat>Approve</q-btn>
				<q-btn-group outline spread class="fit">
					<q-btn @click="addLiquidity" v-if="!isStaking()" color="primary" class="fit" flat>Add Liquidity</q-btn>
					<q-btn @click="beginSupply" v-if="lpTokenAllowance && isActive()" color="primary" flat>
						<div class="text-button">Supply</div>
						<q-tooltip>
							When adding your liquidity tokens into the farm, you harvest your wBAN earned as well!
						</q-tooltip>
					</q-btn>
					<q-btn
						@click="beginWithdraw"
						v-if="lpTokenAllowance"
						:disable="farmData.stakedBalance.isZero()"
						color="primary"
						flat
					>
						<div class="text-button"><span v-if="isFinished()">Harvest &amp; </span>Withdraw</div>
						<q-tooltip>
							When withdrawing your liquidity tokens from the farm, you harvest your wBAN earned as well!
						</q-tooltip>
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
				<q-card-section>
					When adding your liquidity tokens into the farm, you harvest your wBAN earned as well!
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
				<q-card-section>
					When withdrawing your liquidity tokens from the farm, you harvest your wBAN earned as well!
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
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import TokenInput from '@/components/farms/TokenInput.vue'
import ban from '@/store/modules/ban'
import { BigNumber, Signer, ethers } from 'ethers'
import { Benis } from '../../../../artifacts/typechain'
import { FarmData, EMPTY_FARM_DATA, BN_ZERO } from '@/models/FarmData'
import { FarmConfig, Address } from '@/config/constants/types'
import FarmUtils from '@/utils/FarmUtils'
import BEP20Utils from '@/utils/BEP20Utils'
import BenisUtils from '@/utils/BenisUtils'
import TokensUtil from '@/utils/TokensUtil'
import {
	bnToZeroDecimalsStringFilter,
	bnToTwoDecimalsStringFilter,
	bnToSixDecimalsStringFilter,
	bnToExactStringFilter,
} from '@/utils/filters'
import Dialogs from '@/utils/Dialogs'
import numeral from 'numeral'
import { openURL } from 'quasar'
import { getDexUrl } from '@/config/constants/dex'

const benisStore = namespace('benis')
const accountsStore = namespace('accounts')
const pricesStore = namespace('prices')

@Component({
	components: {
		TokenInput,
	},
	filters: {
		bnToZeroDecimalsStringFilter,
		bnToTwoDecimalsStringFilter,
		bnToSixDecimalsStringFilter,
		bnToExactStringFilter,
	},
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

	isLoading = true

	farmData: FarmData = JSON.parse(JSON.stringify(EMPTY_FARM_DATA))

	emptyRewards = true
	lpTokenAllowance = false
	lpTokenBalance = BigNumber.from(0)
	lpStakedTokenBalance = BigNumber.from(0)
	lpAmount = '0'

	promptForSupply = false
	promptForWithdraw = false

	signer!: Signer

	wbanAddress: string = TokensUtil.getWBANAddress()

	private farmUtils!: FarmUtils
	private bep20 = new BEP20Utils()
	private benisUtils = new BenisUtils()

	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	get symbol(): string {
		return this.isStaking() ? 'wBAN' : 'LP'
	}

	get apr(): string {
		if (this.isFinished()) {
			return '0'
		} else {
			return numeral(this.farmData.apr).format('0,0[.]000 a')
		}
	}

	public isStaking(): boolean {
		return this.wbanAddress === this.value.lpAddresses[Farm.ENV_NAME as keyof Address]
	}

	public isActive(): boolean {
		return !this.isFinished()
	}

	public isFinished(): boolean {
		return this.value.ended ?? false
	}

	get depositValueToken0(): BigNumber {
		if (this.isLoading) {
			return BN_ZERO
		}
		return this.farmData.userPoolData.balanceToken0
			.mul(ethers.utils.parseEther(this.farmData.poolData.priceToken0.toString()))
			.div(ethers.utils.parseEther('1'))
	}

	get depositValueToken1(): BigNumber {
		if (this.isLoading) {
			return BN_ZERO
		}
		return this.farmData.userPoolData.balanceToken1
			.mul(ethers.utils.parseEther(this.farmData.poolData.priceToken1.toString()))
			.div(ethers.utils.parseEther('1'))
	}

	addLiquidity() {
		if (this.value.quoteToken.address) {
			const otherToken = this.value.quoteToken.address[Farm.ENV_NAME as keyof Address]
			if (
				getDexUrl() === 'https://app.sushi.com' ||
				getDexUrl() === 'https://pancakeswap.finance' ||
				getDexUrl() === 'https://spookyswap.finance'
			) {
				openURL(`${getDexUrl()}/add/${this.wbanAddress}/${otherToken}`)
			} else {
				openURL(`${getDexUrl()}/#/add/${this.wbanAddress}/${otherToken}`)
			}
		} else {
			if (getDexUrl() === 'https://spookyswap.finance') {
				openURL(`${getDexUrl()}/add/${this.wbanAddress}/FTM`)
			} else {
				openURL(`${getDexUrl()}/#/add/${this.wbanAddress}/ETH`)
			}
		}
	}

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

	@Watch('value')
	async reload(): Promise<void> {
		if (this.provider) {
			this.isLoading = true
			this.signer = this.provider.getSigner()

			this.farmUtils = new FarmUtils()
			this.farmData = await this.farmUtils.computeData(
				this.value,
				Farm.ENV_NAME,
				this.account,
				this.wbanAddress,
				ban.banPriceInUSD,
				this.prices,
				this.signer,
				this.benis
			)
			this.emptyRewards = this.farmData.userPendingRewards.isZero()

			const allowance: BigNumber = await this.bep20.allowance(
				this.account,
				this.value.lpAddresses[Farm.ENV_NAME as keyof Address],
				this.signer
			)
			this.lpTokenAllowance = allowance.gt(BigNumber.from('0'))

			this.isLoading = false
		}
	}

	mounted() {
		this.reload()
		document.addEventListener('web3-connection', this.reload)
	}

	unmounted() {
		document.removeEventListener('web3-connection', this.reload)
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.farm-card
	background-color: lighten($secondary, 10%) !important
	.farm-name .reload
		margin-top: -4px
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
