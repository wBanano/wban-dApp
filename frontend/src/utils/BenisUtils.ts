import { Benis } from '@artifacts/typechain'
import { BigNumber, ethers } from 'ethers'
import humanizeDuration from 'humanize-duration'
import { EndTime, FarmConfig } from '@/config/constants/types'
import Dialogs from './Dialogs'
import FarmUtils from './FarmUtils'

const ONE_UNIT = ethers.utils.parseEther('1')
const ONE_YEAR = 365 * 24 * 60 * 60

class BenisUtils {
	/**
	 * Get farm APR value in %
	 * @param pid the pool ID
	 * @param wbanPriceUsd wBAN price in USD
	 * @param poolLiquidityUsd Total pool liquidity in USD
	 * @returns
	 */
	public async getFarmAPR(
		pid: number,
		envName: string,
		wbanPriceUsd: BigNumber,
		poolLiquidityUsd: BigNumber,
		benis: Benis
	): Promise<number> {
		if (poolLiquidityUsd.isZero()) {
			return 0
		}
		if (this.getFarmDurationLeft(pid, envName) === 'Finished') {
			return 0
		}
		const wbanPerSecond = await benis.wbanPerSecond()
		const wbanPerYear = wbanPerSecond.mul(ONE_YEAR)
		const pool = await benis.poolInfo(pid)
		const poolRewardsPerYear = wbanPerYear.mul(pool.allocPoint).div(await benis.totalAllocPoint())
		const apr = poolRewardsPerYear.mul(wbanPriceUsd).div(poolLiquidityUsd).mul(100).div(ONE_UNIT)
		return apr.toNumber()
	}

	public async getFarmWeight(pid: number, benis: Benis): Promise<number> {
		const totalAlloc = await benis.totalAllocPoint()
		const pool = await benis.poolInfo(pid)
		return pool.allocPoint / totalAlloc.toNumber()
	}

	public getFarmDurationLeft(pid: number, environment: string): string {
		const now = Date.now()
		const farmEndTime = this.getEndTime(pid, environment) * 1_000
		if (farmEndTime && farmEndTime > now) {
			return humanizeDuration(farmEndTime - now, { largest: 2 })
		} else {
			console.warn(`Pool (pid: ${pid}) is finished!`)
			return 'Finished'
		}
	}

	public async getStakedBalance(pid: number, account: string, benis: Benis): Promise<BigNumber> {
		const userPoolStaked = await benis.userInfo(pid, account)
		return userPoolStaked.amount
	}

	public async supply(pid: number, lpAmount: string, lpSymbol: string, benis: Benis): Promise<string> {
		const txn = await benis.deposit(pid, ethers.utils.parseEther(lpAmount))
		Dialogs.startFarmSupply(lpAmount, lpSymbol)
		return (await txn.wait()).transactionHash
	}

	public async withdraw(pid: number, lpAmount: string, lpSymbol: string, benis: Benis): Promise<string> {
		const txn = await benis.withdraw(pid, ethers.utils.parseEther(lpAmount))
		Dialogs.startFarmWithdraw(lpAmount, lpSymbol)
		return (await txn.wait()).transactionHash
	}

	public async harvest(pid: number, benis: Benis): Promise<string> {
		const txn = await benis.withdraw(pid, BigNumber.from(0))
		return (await txn.wait()).transactionHash
	}

	public async getPendingRewards(pid: number, account: string, benis: Benis): Promise<BigNumber> {
		return benis.pendingWBAN(pid, account)
	}

	private getEndTime(pid: number, environment: string): number {
		const farms = FarmUtils.getFarms()
		const farm: FarmConfig | undefined = farms.find((farm) => farm.pid === pid)
		if (farm) {
			return farm.endTime[environment as keyof EndTime]
		} else {
			throw new Error(`Farm with pid ${pid} is not properly configured`)
		}
	}
}

export default BenisUtils
