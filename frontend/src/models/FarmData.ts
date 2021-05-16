import { Address } from '@/config/constants/types'
import { BigNumber } from 'ethers'

export interface FarmData {
	pid: number
	poolData: PoolData
	userPoolData: UserPoolData // only for liquidity pools

	userGlobalBalance?: BigNumber // for wBAN staking only
	userPendingRewards: BigNumber
	timeLeft: string

	apr: number
	totalValue: BigNumber
	stakedBalance: BigNumber
	stakedValue: BigNumber
}

interface PoolData {
	name: string
	symbol: string
	address: Address
	tvl: BigNumber
	balanceToken0: BigNumber
	balanceToken1?: BigNumber // empty when wBAN stakiing
	priceToken0: number
	priceToken1: number
	symbolToken0: string
	symbolToken1: string
}

interface UserPoolData {
	balance: BigNumber
	balanceToken0: BigNumber
	balanceToken1: BigNumber
}

export const BN_ZERO = BigNumber.from(0)

export const EMPTY_FARM_DATA: FarmData = {
	pid: 0,
	poolData: {
		name: '',
		symbol: '',
		address: {
			dev: '',
			staging: '',
			production: ''
		},
		tvl: BN_ZERO,
		balanceToken0: BN_ZERO,
		balanceToken1: BN_ZERO,
		priceToken0: 0,
		priceToken1: 0,
		symbolToken0: '',
		symbolToken1: ''
	},
	userPoolData: {
		balance: BN_ZERO,
		balanceToken0: BN_ZERO,
		balanceToken1: BN_ZERO
	},
	userGlobalBalance: BN_ZERO,
	userPendingRewards: BN_ZERO,
	timeLeft: '',
	apr: 0,
	totalValue: BN_ZERO,
	stakedBalance: BN_ZERO,
	stakedValue: BN_ZERO
}
