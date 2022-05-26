import { BigNumber, providers } from 'ethers'

type PermitSignatureRequest = {
	amount: BigNumber
	spender: string
	deadline: BigNumber
	provider: providers.Web3Provider
}

export { PermitSignatureRequest }
