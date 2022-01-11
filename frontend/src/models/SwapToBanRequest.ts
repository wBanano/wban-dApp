import { WBANToken } from '@artifacts/typechain'
import { BigNumber } from 'ethers'

type SwapToBanRequest = {
	amount: BigNumber
	toBanAddress: string
	contract: WBANToken
}

export { SwapToBanRequest }
