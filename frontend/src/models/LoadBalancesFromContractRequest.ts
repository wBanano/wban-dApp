import { WBANToken } from '@artifacts/typechain'

type LoadBalancesFromContractRequest = {
	contract: WBANToken
	account: string
}

export default LoadBalancesFromContractRequest
