import { WBANLPRewards } from 'wban-nfts'

type ClaimableNft = {
	address: string
	nft: number
	quantity: number
	uuid: number
	receipt: string
}

type ClaimAirdroppedNftRequest = {
	contract: WBANLPRewards
	claimableNfts: Array<ClaimableNft>
}

export { ClaimableNft, ClaimAirdroppedNftRequest }
