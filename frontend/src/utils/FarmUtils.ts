import { Address, FarmConfig } from '@/config/constants/types'
import { FarmData, EMPTY_FARM_DATA, BN_ZERO } from '@/models/FarmData'
import { Benis } from '@artifacts/typechain'
import { BigNumber, ethers, Signer } from 'ethers'
import BenisUtils from './BenisUtils'
import BEP20Utils from './BEP20Utils'

const BN_ONE = ethers.utils.parseEther('1')

class FarmUtils {
	private farmConfig!: FarmConfig
	private envName = ''
	private account = ''
	private wbanAddress = ''
	private banPriceInUSD = 0
	private prices: Map<string, number> = new Map()

	public async computeData(
		farmConfig: FarmConfig,
		envName: string,
		account: string,
		wbanAddress: string,
		banPriceInUSD: number,
		prices: Map<string, number>,
		signer: Signer,
		benis: Benis
	): Promise<FarmData> {
		this.farmConfig = farmConfig
		this.envName = envName
		this.account = account
		this.wbanAddress = wbanAddress
		this.banPriceInUSD = banPriceInUSD
		this.prices = prices

		const benisUtils = new BenisUtils()

		let farmData = JSON.parse(JSON.stringify(EMPTY_FARM_DATA))
		farmData.pid = this.farmConfig.pid
		farmData.poolData.address = this.farmConfig.lpAddresses
		farmData.poolData.name = this.farmConfig.lpSymbol
		farmData.poolData.symbolToken0 = this.farmConfig.token.symbol
		farmData.poolData.symbolToken1 = this.farmConfig.quoteToken.symbol

		farmData.timeLeft = await benisUtils.getFarmDurationLeft(farmData.pid, envName)

		farmData = await this.computeAPR(farmData, signer, benis)
		if (this.isStaking()) {
			farmData.userGlobalBalance = farmData.stakedBalance.add(farmData.userPendingRewards)
			farmData.stakedValue = farmData.stakedBalance.mul(ethers.utils.parseEther(banPriceInUSD.toString())).div(BN_ONE)
			farmData.totalValue = farmData.userGlobalBalance
				.mul(ethers.utils.parseEther(banPriceInUSD.toString()))
				.div(BN_ONE)
		} else {
			farmData.userGlobalBalance = farmData.stakedBalance
			const userValueToken0 = farmData.userPoolData.balanceToken0
				.mul(ethers.utils.parseEther(farmData.poolData.priceToken0.toString()))
				.div(BN_ONE)
			const userValueToken1 = farmData.userPoolData.balanceToken1
				.mul(ethers.utils.parseEther(farmData.poolData.priceToken1.toString()))
				.div(BN_ONE)
			farmData.stakedValue = userValueToken0.add(userValueToken1)
			console.warn(`Staked value: ${ethers.utils.formatEther(farmData.stakedValue)}`)
			farmData.totalValue = farmData.stakedValue.add(
				farmData.userPendingRewards.mul(ethers.utils.parseEther(banPriceInUSD.toString())).div(BN_ONE)
			)
		}
		return farmData
	}

	public isStaking(): boolean {
		return this.wbanAddress === this.farmConfig.lpAddresses[this.envName as keyof Address]
	}

	private async computeAPR(farmData: FarmData, signer: Signer, benis: Benis): Promise<FarmData> {
		console.info(`Computing APR for ${farmData.poolData.name}`)

		const bep20 = new BEP20Utils()
		const benisUtils = new BenisUtils()

		const wbanPriceUsd = ethers.utils.parseEther(this.banPriceInUSD.toString())

		let poolLiquidityUsd = BN_ZERO
		if (this.wbanAddress === farmData.poolData.address[this.envName as keyof Address]) {
			farmData.poolData.symbol = 'wBAN'
			farmData.poolData.priceToken0 = this.banPriceInUSD
			farmData.poolData.priceToken1 = this.banPriceInUSD
			const userInfo = await benis.userInfo(farmData.pid, this.account)
			farmData.stakedBalance = userInfo.amount
			farmData.userPendingRewards = await benis.pendingWBAN(farmData.pid, this.account)
			farmData.userPoolData = {
				balance: farmData.stakedBalance,
				balanceToken0: BigNumber.from(0),
				balanceToken1: BN_ZERO
			}
			const pool = await benis.poolInfo(farmData.pid)
			const wbanLiquidity: BigNumber = pool.stakingTokenTotalAmount
			farmData.poolData.balanceToken0 = wbanLiquidity
			console.debug(`Benis is hodling ${ethers.utils.formatEther(wbanLiquidity)} wBAN`)
			poolLiquidityUsd = wbanLiquidity.mul(wbanPriceUsd).div(BN_ONE)
		} else {
			farmData.poolData.symbol = 'LP'
			const userInfo = await benis.userInfo(farmData.pid, this.account)
			farmData.stakedBalance = userInfo.amount
			const lpDetails = await bep20.getLPDetails(
				this.account,
				farmData.stakedBalance,
				farmData.poolData.address[this.envName as keyof Address],
				signer
			)
			console.warn(`LP details: ${JSON.stringify(lpDetails)}`)
			farmData.poolData.priceToken0 = await this.getTokenPriceUsd(lpDetails.token0.address, signer, bep20)
			farmData.poolData.priceToken1 = await this.getTokenPriceUsd(lpDetails.token1.address, signer, bep20)
			console.debug(
				`Prices: token0 (${farmData.poolData.symbolToken0}): $${farmData.poolData.priceToken0}, token1 (${farmData.poolData.symbolToken1}): $${farmData.poolData.priceToken1}`
			)
			farmData.poolData.symbolToken0 = await bep20.getTokenSymbol(lpDetails.token0.address, signer)
			farmData.poolData.symbolToken1 = await bep20.getTokenSymbol(lpDetails.token1.address, signer)
			farmData.userPendingRewards = await benis.pendingWBAN(farmData.pid, this.account)

			farmData.userPoolData = {
				balance: userInfo.amount,
				balanceToken0: lpDetails.token0.user,
				balanceToken1: lpDetails.token1.user
			}

			const liquidityToken0: BigNumber = lpDetails.token0.liquidity
			const liquidityToken1: BigNumber = lpDetails.token1.liquidity
			console.debug(
				`Liquidities: token0: ${ethers.utils.formatEther(liquidityToken0)}, token1: ${ethers.utils.formatEther(
					liquidityToken1
				)}`
			)
			const liquidityUsdToken0: BigNumber = liquidityToken0
				.mul(ethers.utils.parseEther(farmData.poolData.priceToken0.toString()))
				.div(BN_ONE)
			const liquidityUsdToken1: BigNumber = liquidityToken1
				.mul(ethers.utils.parseEther(farmData.poolData.priceToken1.toString()))
				.div(BN_ONE)
			console.debug(
				`Liquidities in USD: token0: $${ethers.utils.formatEther(
					liquidityUsdToken0
				)}, token1: $${ethers.utils.formatEther(liquidityUsdToken1)}`
			)
			poolLiquidityUsd = liquidityUsdToken0.add(liquidityUsdToken1)
		}

		farmData.poolData.tvl = poolLiquidityUsd
		console.debug(`Pool liquidity price: ${ethers.utils.formatEther(poolLiquidityUsd)}`)

		farmData.apr = await benisUtils.getFarmAPR(farmData.pid, wbanPriceUsd, poolLiquidityUsd, benis)
		return farmData
	}

	private async getTokenPriceUsd(address: string, signer: Signer, bep20: BEP20Utils): Promise<number> {
		const symbol = await bep20.getTokenSymbol(address, signer)
		// check if wBAN
		if (address === this.wbanAddress) {
			return this.banPriceInUSD
		} else {
			const price = this.prices.get(symbol)
			if (price) {
				return price
			} else {
				throw new Error(`Can't find ${symbol} data at "${address}" for env "${this.envName}"`)
			}
		}
	}
}

export default FarmUtils
