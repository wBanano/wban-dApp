import Accounts from '@/store/modules/accounts'
import {
	BSC_MAINNET,
	BSC_TESTNET,
	POLYGON_MAINNET,
	POLYGON_TESTNET,
	FANTOM_MAINNET,
	FANTOM_TESTNET,
	ETHEREUM_MAINNET,
	ETHEREUM_TESTNET,
	ARBITRUM_MAINNET,
	ARBITRUM_TESTNET,
} from '@/utils/Networks'

function getBackendHost(): string {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
			return 'https://bsc-api.banano.cc'
		case POLYGON_MAINNET.chainIdNumber:
			return 'https://polygon-api.banano.cc'
		case FANTOM_MAINNET.chainIdNumber:
			return 'https://fantom-api.banano.cc'
		case ETHEREUM_MAINNET.chainIdNumber:
			return 'https://ethereum-api.banano.cc'
		case ARBITRUM_MAINNET.chainIdNumber:
			return 'https://arbitrum-api.banano.cc'
		case BSC_TESTNET.chainIdNumber:
		case POLYGON_TESTNET.chainIdNumber:
		case FANTOM_TESTNET.chainIdNumber:
		case ETHEREUM_TESTNET.chainIdNumber:
		case ARBITRUM_TESTNET.chainIdNumber:
			return 'https://wban-api.banano-testing.cc'
		default:
			throw new Error('Unexpected network')
	}
}

export { getBackendHost }
