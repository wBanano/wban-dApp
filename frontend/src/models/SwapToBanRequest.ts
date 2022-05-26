import { WBANTokenWithPermit } from '@artifacts/typechain'
import { BigNumber } from 'ethers'

type SwapToBanRequest = {
	amount: BigNumber
	toBanAddress: string
	contract: WBANTokenWithPermit
}

export { SwapToBanRequest }
