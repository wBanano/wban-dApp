import { Address, FarmConfig } from '@/config/constants/types'
import { FarmData, EMPTY_FARM_DATA, BN_ZERO } from '@/models/FarmData'
import { Benis } from '@artifacts/typechain'
import { BigNumber, ethers, Signer } from 'ethers'
import BenisUtils from './BenisUtils'
import BEP20Utils from './BEP20Utils'
import { bscFarms, fantomFarms, polygonFarms } from '@/config/constants/farms'

const BN_ONE = ethers.utils.parseEther('1')

class FarmUtils {
	private farmConfig!: FarmConfig
	private envName = ''
	private account = ''
	private wbanAddress = ''
	private banPriceInUSD = 0
	private prices: Map<string, number> = new Map()

	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''
	static BLOCKCHAIN: string = process.env.VUE_APP_BLOCKCHAIN || ''

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

		farmData = await this.computeAPR(farmData, envName, signer, benis)
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
			farmData.totalValue = farmData.stakedValue.add(
				farmData.userPendingRewards.mul(ethers.utils.parseEther(banPriceInUSD.toString())).div(BN_ONE)
			)
		}
		return farmData
	}

	public isStaking(): boolean {
		return this.wbanAddress === this.farmConfig.lpAddresses[this.envName as keyof Address]
	}

	public static getFarms(): FarmConfig[] {
		switch (FarmUtils.BLOCKCHAIN) {
			// BSC farms
			case 'bsc':
				return bscFarms
			// Polygon farms
			case 'polygon':
				return polygonFarms
			// Fantom farms
			case 'fantom':
				return fantomFarms
			default:
				throw new Error('Unexpected network')
		}
	}

	private async computeAPR(farmData: FarmData, envName: string, signer: Signer, benis: Benis): Promise<FarmData> {
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
				balanceToken1: BN_ZERO,
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
			farmData.poolData.priceToken0 = await this.getTokenPriceUsd(lpDetails.token0.address, signer, bep20)
			farmData.poolData.priceToken1 = await this.getTokenPriceUsd(lpDetails.token1.address, signer, bep20)
			farmData.poolData.symbolToken0 = await bep20.getTokenSymbol(lpDetails.token0.address, signer)
			farmData.poolData.symbolToken1 = await bep20.getTokenSymbol(lpDetails.token1.address, signer)
			farmData.userPendingRewards = await benis.pendingWBAN(farmData.pid, this.account)

			const token0decimals = lpDetails.token0.decimals
			const token1decimals = lpDetails.token1.decimals

			farmData.userPoolData = {
				balance: userInfo.amount,
				balanceToken0: ethers.utils.parseEther(ethers.utils.formatUnits(lpDetails.token0.user, token0decimals)),
				balanceToken1: ethers.utils.parseEther(ethers.utils.formatUnits(lpDetails.token1.user, token1decimals)),
			}

			farmData.poolData.addressToken0 = lpDetails.token0.address
			farmData.poolData.addressToken1 = lpDetails.token1.address
			farmData.poolData.decimalsToken0 = token0decimals
			farmData.poolData.decimalsToken1 = token1decimals

			const liquidityToken0: BigNumber = lpDetails.token0.liquidity
			const liquidityToken1: BigNumber = lpDetails.token1.liquidity
			const liquidityUsdToken0: BigNumber = ethers.utils
				.parseEther(ethers.utils.formatUnits(liquidityToken0, token0decimals))
				.mul(ethers.utils.parseEther(farmData.poolData.priceToken0.toString()))
				.div(BN_ONE)
			const liquidityUsdToken1: BigNumber = ethers.utils
				.parseEther(ethers.utils.formatUnits(liquidityToken1, token1decimals))
				.mul(ethers.utils.parseEther(farmData.poolData.priceToken1.toString()))
				.div(BN_ONE)
			poolLiquidityUsd = liquidityUsdToken0.add(liquidityUsdToken1)
		}

		farmData.poolData.tvl = poolLiquidityUsd
		console.debug(`Pool liquidity price: $${ethers.utils.formatEther(poolLiquidityUsd)}`)

		farmData.apr = await benisUtils.getFarmAPR(farmData.pid, envName, wbanPriceUsd, poolLiquidityUsd, benis)
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
