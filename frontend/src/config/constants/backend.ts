import Accounts from '@/store/modules/accounts'
import {
	BSC_MAINNET,
	BSC_TESTNET,
	POLYGON_MAINNET,
	POLYGON_TESTNET,
	FANTOM_MAINNET,
	FANTOM_TESTNET,
} from '@/utils/Networks'

function getBackendHost(): string {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
			return 'https://bsc-api.banano.cc'
		case POLYGON_MAINNET.chainIdNumber:
			return 'https://polygon-api.banano.cc'
		case FANTOM_MAINNET.chainIdNumber:
			return 'https://fantom-api.banano.cc'
		case BSC_TESTNET.chainIdNumber:
		case POLYGON_TESTNET.chainIdNumber:
		case FANTOM_TESTNET.chainIdNumber:
			return 'https://wban-api.kalixia.com'
		default:
			throw new Error('Unexpected network')
	}
}

export { getBackendHost }
