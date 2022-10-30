import { FarmConfig } from './types'
import BSCFarms from './bsc/farms'
import PolygonFarms from './polygon/farms'
import FantomFarms from './fantom/farms'
import EthereumFarms from './ethereum/farms'
import GoerliFarms from './ethereum/goerli/farms'
import Accounts from '@/store/modules/accounts'
import {
	BSC_MAINNET,
	BSC_TESTNET,
	ETHEREUM_MAINNET,
	ETHEREUM_TESTNET,
	FANTOM_MAINNET,
	FANTOM_TESTNET,
	POLYGON_MAINNET,
	POLYGON_TESTNET,
} from '@/utils/Networks'

const bsc = new BSCFarms()
const polygon = new PolygonFarms()
const fantom = new FantomFarms()
const ethereum = new EthereumFarms()
const goerli = new GoerliFarms()

function getBenisAddress(): string {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
		case BSC_TESTNET.chainIdNumber:
			return bsc.getBenisAddress()
		case POLYGON_MAINNET.chainIdNumber:
		case POLYGON_TESTNET.chainIdNumber:
			return polygon.getBenisAddress()
		case FANTOM_MAINNET.chainIdNumber:
		case FANTOM_TESTNET.chainIdNumber:
			return fantom.getBenisAddress()
		case ETHEREUM_MAINNET.chainIdNumber:
			return ethereum.getBenisAddress()
		case ETHEREUM_TESTNET.chainIdNumber:
			return goerli.getBenisAddress()
		default:
			throw new Error('Unexpected network')
	}
}

function hasPermitFeature(): boolean {
	switch (Accounts.network.chainIdNumber) {
		case ETHEREUM_MAINNET.chainIdNumber:
		case ETHEREUM_TESTNET.chainIdNumber:
			return true
		default:
			return false
	}
}

function getFarms(): FarmConfig[] {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
		case BSC_TESTNET.chainIdNumber:
			return bsc.getFarms()
		case POLYGON_MAINNET.chainIdNumber:
		case POLYGON_TESTNET.chainIdNumber:
			return polygon.getFarms()
		case FANTOM_MAINNET.chainIdNumber:
		case FANTOM_TESTNET.chainIdNumber:
			return fantom.getFarms()
		case ETHEREUM_MAINNET.chainIdNumber:
			return ethereum.getFarms()
		case ETHEREUM_TESTNET.chainIdNumber:
			return goerli.getFarms()
		default:
			throw new Error('Unexpected network')
	}
}

export { getBenisAddress, hasPermitFeature, getFarms }
