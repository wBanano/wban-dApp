import { Web3Provider } from '@ethersproject/providers'

declare type Permit = {
	amount: string // amount of wBAN to swap
	deadline: number // permit deadline
	signature: string // Permit signature to spend wBAN
}

declare type GaslessSwapRequest = {
	banWallet: string
	recipient: string // blockchain address of the user requesting the gasless swap
	permit: Permit
	gasLimit: number
	swapCallData: string // the 0x `data` field from the API response
	provider: Web3Provider
}

export { GaslessSwapRequest }
