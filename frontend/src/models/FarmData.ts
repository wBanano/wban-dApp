import { Address } from '@/config/constants/types'
import { BigNumber } from 'ethers'

interface PoolData {
	name: string
	symbol: string
	address: Address
	tvl: BigNumber
	balanceToken0: BigNumber
	balanceToken1?: BigNumber // empty when wBAN stakiing
	priceToken0: number
	priceToken1: number
	addressToken0: string
	addressToken1: string
	symbolToken0: string
	symbolToken1: string
	decimalsToken0: number
	decimalsToken1: number
}

interface UserPoolData {
	balance: BigNumber
	balanceToken0: BigNumber
	balanceToken1: BigNumber
}

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

export const BN_ZERO = BigNumber.from(0)

export const EMPTY_FARM_DATA: FarmData = {
	pid: 0,
	poolData: {
		name: '',
		symbol: '',
		address: {
			dev: '',
			staging: '',
			production: '',
		},
		tvl: BN_ZERO,
		balanceToken0: BN_ZERO,
		balanceToken1: BN_ZERO,
		priceToken0: 0,
		priceToken1: 0,
		addressToken0: '',
		addressToken1: '',
		symbolToken0: '',
		symbolToken1: '',
		decimalsToken0: 0,
		decimalsToken1: 0,
	},
	userPoolData: {
		balance: BN_ZERO,
		balanceToken0: BN_ZERO,
		balanceToken1: BN_ZERO,
	},
	userGlobalBalance: BN_ZERO,
	userPendingRewards: BN_ZERO,
	timeLeft: '',
	apr: 0,
	totalValue: BN_ZERO,
	stakedBalance: BN_ZERO,
	stakedValue: BN_ZERO,
}
