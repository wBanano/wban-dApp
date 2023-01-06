import { FarmConfig } from './types'
import BSCFarms from './bsc/farms'
import PolygonFarms from './polygon/farms'
import FantomFarms from './fantom/farms'
import EthereumFarms from './ethereum/farms'
import GoerliFarms from './ethereum/goerli/farms'
import ArbitrumFarms from './arbitrum/farms'
import Accounts from '@/store/modules/accounts'
import {
	ARBITRUM_MAINNET,
	ARBITRUM_TESTNET,
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
const arbitrum = new ArbitrumFarms()

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
		case ARBITRUM_MAINNET.chainIdNumber:
		case ARBITRUM_TESTNET.chainIdNumber:
			return arbitrum.getBenisAddress()
		default:
			throw new Error('Unexpected network')
	}
}

function getZapAddress(): string {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
		case BSC_TESTNET.chainIdNumber:
			return bsc.getZapAddress()
		case POLYGON_MAINNET.chainIdNumber:
		case POLYGON_TESTNET.chainIdNumber:
			return polygon.getZapAddress()
		case FANTOM_MAINNET.chainIdNumber:
		case FANTOM_TESTNET.chainIdNumber:
			return fantom.getZapAddress()
		case ETHEREUM_MAINNET.chainIdNumber:
			return ethereum.getZapAddress()
		case ETHEREUM_TESTNET.chainIdNumber:
			return goerli.getZapAddress()
		case ARBITRUM_MAINNET.chainIdNumber:
		case ARBITRUM_TESTNET.chainIdNumber:
			return arbitrum.getZapAddress()
		default:
			throw new Error('Unexpected network')
	}
}

function hasPermitFeature(): boolean {
	switch (Accounts.network.chainIdNumber) {
		case ETHEREUM_MAINNET.chainIdNumber:
		case ETHEREUM_TESTNET.chainIdNumber:
		case ARBITRUM_MAINNET.chainIdNumber:
		case ARBITRUM_TESTNET.chainIdNumber:
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
		case ARBITRUM_MAINNET.chainIdNumber:
		case ARBITRUM_TESTNET.chainIdNumber:
			return arbitrum.getFarms()
		default:
			throw new Error('Unexpected network')
	}
}

export { getBenisAddress, getZapAddress, hasPermitFeature, getFarms }
