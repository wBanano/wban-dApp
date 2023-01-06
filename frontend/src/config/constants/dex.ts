import Accounts from '@/store/modules/accounts'
import BSCDEX from './bsc/dex'
import PolygonDEX from './polygon/dex'
import FantomDEX from './fantom/dex'
import EthereumDEX from './ethereum/dex'
import GoerliDEX from './ethereum/goerli/dex'
import ArbitrumDEX from './arbitrum/dex'
import { getBackendHost } from './backend'
import {
	BSC_MAINNET,
	FANTOM_MAINNET,
	POLYGON_MAINNET,
	ETHEREUM_MAINNET,
	ETHEREUM_TESTNET,
	ARBITRUM_MAINNET,
	ARBITRUM_TESTNET,
} from '@/utils/Networks'
import axios from 'axios'
import { DEXAggregator } from '@/models/dex/SwapQuote'

const bsc = new BSCDEX()
const polygon = new PolygonDEX()
const fantom = new FantomDEX()
const ethereum = new EthereumDEX()
const goerli = new GoerliDEX()
const arbitrum = new ArbitrumDEX()

type Token = {
	name: string
	address: string
	symbol: string
	decimals: number
	chainId: number
	logoURI: string
}

const EMPTY_TOKEN: Token = {
	name: '',
	symbol: '',
	address: '',
	logoURI: '',
	decimals: 18,
	chainId: 0,
}

function getDexUrl() {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
			return bsc.getDexUrl()
		case POLYGON_MAINNET.chainIdNumber:
			return polygon.getDexUrl()
		case FANTOM_MAINNET.chainIdNumber:
			return fantom.getDexUrl()
		case ETHEREUM_MAINNET.chainIdNumber:
			return ethereum.getDexUrl()
		case ETHEREUM_TESTNET.chainIdNumber:
			return goerli.getDexUrl()
		case ARBITRUM_MAINNET.chainIdNumber:
		case ARBITRUM_TESTNET.chainIdNumber:
			return arbitrum.getDexUrl()
		default:
			throw new Error('Unexpected network')
	}
}

function getDexAggregator(): DEXAggregator {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
			return bsc.getDexAggregator()
		case POLYGON_MAINNET.chainIdNumber:
			return polygon.getDexAggregator()
		case FANTOM_MAINNET.chainIdNumber:
			return fantom.getDexAggregator()
		case ETHEREUM_MAINNET.chainIdNumber:
			return ethereum.getDexAggregator()
		case ARBITRUM_MAINNET.chainIdNumber:
			return arbitrum.getDexAggregator()
		default:
			throw new Error('Unexpected network')
	}
}

function getDexAggregatorUri(): string {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
			return bsc.getDexAggregatorUri()
		case POLYGON_MAINNET.chainIdNumber:
			return polygon.getDexAggregatorUri()
		case FANTOM_MAINNET.chainIdNumber:
			return fantom.getDexAggregatorUri()
		case ETHEREUM_MAINNET.chainIdNumber:
			return ethereum.getDexAggregatorUri()
		case ARBITRUM_MAINNET.chainIdNumber:
			return arbitrum.getDexAggregatorUri()
		default:
			throw new Error('Unexpected network')
	}
}

function getDexAggregatorAllowanceTarget(): string {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
			return bsc.getDexAggregatorAllowanceTarget()
		case POLYGON_MAINNET.chainIdNumber:
			return polygon.getDexAggregatorAllowanceTarget()
		case FANTOM_MAINNET.chainIdNumber:
			return fantom.getDexAggregatorAllowanceTarget()
		case ETHEREUM_MAINNET.chainIdNumber:
			return ethereum.getDexAggregatorAllowanceTarget()
		case ARBITRUM_MAINNET.chainIdNumber:
			return arbitrum.getDexAggregatorAllowanceTarget()
		default:
			throw new Error('Unexpected network')
	}
}

async function getTokensList(): Promise<Array<Token>> {
	console.info(`Fetching tokens list for ${Accounts.network.network} from ${getBackendHost()}/dex/tokens`)
	const result = await axios.get(`${getBackendHost()}/dex/tokens`)
	const tokens: Token[] = result.data.tokens.filter((token: Token) => token.chainId === Accounts.network.chainIdNumber)
	const nativeCrypto = Accounts.network.nativeCurrency
	const nativeToken: Token = {
		name: nativeCrypto.name,
		symbol: nativeCrypto.symbol,
		decimals: nativeCrypto.decimals,
		address: '',
		chainId: Accounts.network.chainIdNumber,
		logoURI: `/${Accounts.network.network}-home-logo.svg`,
	}
	tokens.push(nativeToken)
	console.debug(`Found ${tokens.length} tokens`)
	return tokens
}

export {
	getDexUrl,
	getDexAggregator,
	getDexAggregatorUri,
	getDexAggregatorAllowanceTarget,
	getTokensList,
	Token,
	EMPTY_TOKEN,
}
