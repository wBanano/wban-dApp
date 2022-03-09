import { Benis } from '@artifacts/typechain'
import { BigNumber, ethers } from 'ethers'
import Dialogs from './Dialogs'

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
		wbanPriceUsd: BigNumber,
		poolLiquidityUsd: BigNumber,
		benis: Benis
	): Promise<number> {
		if (poolLiquidityUsd.isZero()) {
			return 0
		}
		if ((await BenisUtils.getEndTime(pid, benis)) * 1_000 <= Date.now()) {
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

	public async getStakedBalance(pid: number, account: string, benis: Benis): Promise<BigNumber> {
		const userPoolStaked = await benis.userInfo(pid, account)
		return userPoolStaked.amount
	}

	public async supply(pid: number, lpAmount: string, lpSymbol: string, benis: Benis): Promise<string> {
		const txn = await benis.deposit(pid, ethers.utils.parseEther(lpAmount))
		Dialogs.startFarmSupply(lpAmount, lpSymbol)
		return (await txn.wait(2)).transactionHash
	}

	public async withdraw(pid: number, lpAmount: string, lpSymbol: string, benis: Benis): Promise<string> {
		const txn = await benis.withdraw(pid, ethers.utils.parseEther(lpAmount))
		Dialogs.startFarmWithdraw(lpAmount, lpSymbol)
		return (await txn.wait(2)).transactionHash
	}

	public async harvest(pid: number, benis: Benis): Promise<string> {
		const txn = await benis.withdraw(pid, BigNumber.from(0))
		return (await txn.wait(2)).transactionHash
	}

	public async getPendingRewards(pid: number, account: string, benis: Benis): Promise<BigNumber> {
		return benis.pendingWBAN(pid, account)
	}

	public static async getEndTime(pid: number, benis: Benis): Promise<number> {
		const farm = await benis.poolInfo(pid)
		return farm.allocPoint === 0 ? (Date.now() - 10_000) / 1_000 : benis.endTime()
	}
}

export default BenisUtils
