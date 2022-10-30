import bsc from './bsc/tokens'
import polygon from './polygon/tokens'
import fantom from './fantom/tokens'
import ethereum from './ethereum/tokens'
import goerli from './ethereum/goerli/tokens'
import { TokensList } from './types'
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
} from '@/utils/Networks'

const bscTokens: TokensList = bsc
const polygonTokens: TokensList = polygon
const fantomTokens: TokensList = fantom
const ethereumTokens: TokensList = ethereum
const goerliTokens: TokensList = goerli

function getTokens(): TokensList {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
		case BSC_TESTNET.chainIdNumber:
			return bscTokens
		case POLYGON_MAINNET.chainIdNumber:
		case POLYGON_TESTNET.chainIdNumber:
			return polygonTokens
		case FANTOM_MAINNET.chainIdNumber:
		case FANTOM_TESTNET.chainIdNumber:
			return fantomTokens
		case ETHEREUM_MAINNET.chainIdNumber:
			return ethereumTokens
		case ETHEREUM_TESTNET.chainIdNumber:
			return goerliTokens
		default:
			throw new Error('Unexpected network')
	}
}

export { getTokens }
