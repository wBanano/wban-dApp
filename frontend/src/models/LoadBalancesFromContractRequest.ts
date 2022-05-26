import { WBANTokenWithPermit } from '@artifacts/typechain'

type LoadBalancesFromContractRequest = {
	contract: WBANTokenWithPermit
	account: string
}

export { LoadBalancesFromContractRequest }
