import { ethers } from "ethers"

type ClaimRequest = {
	banAddress: string
	blockchainAddress: string
	provider: ethers.providers.Web3Provider
}

export { ClaimRequest }
