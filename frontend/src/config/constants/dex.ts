import Accounts from '@/store/modules/accounts'
import BSCDEX from './bsc/dex'
import PolygonDEX from './polygon/dex'
import FantomDEX from './fantom/dex'
import { getBackendHost } from './backend'
import { BSC_MAINNET, FANTOM_MAINNET, POLYGON_MAINNET } from '@/utils/Networks'
import axios from 'axios'

const bsc = new BSCDEX()
const polygon = new PolygonDEX()
const fantom = new FantomDEX()

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
		default:
			throw new Error('Unexpected network')
	}
}

function get0xSwapAPI(): string {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
			return bsc.get0xSwapAPI()
		case POLYGON_MAINNET.chainIdNumber:
			return polygon.get0xSwapAPI()
		case FANTOM_MAINNET.chainIdNumber:
			return fantom.get0xSwapAPI()
		default:
			throw new Error('Unexpected network')
	}
}

function get0xExchangeRouterAddress(): string {
	switch (Accounts.network.chainIdNumber) {
		case BSC_MAINNET.chainIdNumber:
			return bsc.get0xExchangeRouterAddress()
		case POLYGON_MAINNET.chainIdNumber:
			return polygon.get0xExchangeRouterAddress()
		case FANTOM_MAINNET.chainIdNumber:
			return fantom.get0xExchangeRouterAddress()
		default:
			throw new Error('Unexpected network')
	}
}

async function getTokensList(): Promise<Array<Token>> {
	console.info(`Fetching tokens list from ${getBackendHost()}/dex/tokens`)
	const result = await axios.get(`${getBackendHost()}/dex/tokens`)
	const tokens = result.data.tokens.filter((token: Token) => token.chainId === Accounts.network.chainIdNumber)
	console.debug(`Found ${tokens.length} tokens`)
	return tokens
}

export { getDexUrl, get0xSwapAPI, get0xExchangeRouterAddress, getTokensList, Token, EMPTY_TOKEN }
