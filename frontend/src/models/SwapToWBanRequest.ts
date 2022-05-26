import { WBANTokenWithPermit } from '@artifacts/typechain'
import { BigNumber } from 'ethers'

type SwapToWBanRequest = {
	amount: BigNumber
	blockchainWallet: string
	receipt: string
	uuid: string
	contract: WBANTokenWithPermit
}

export { SwapToWBanRequest }
