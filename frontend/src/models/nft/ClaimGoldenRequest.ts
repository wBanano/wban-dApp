import { WBANLPRewards } from 'wban-nfts'

type ClaimGoldenRequest = {
	contract: WBANLPRewards
	account: string
	level: number
}

export default ClaimGoldenRequest
