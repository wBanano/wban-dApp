import BSCDEX from './bsc/dex'
import PolygonDEX from './polygon/dex'
import FantomDEX from './fantom/dex'
import axios from 'axios'
import { Networks } from '@/utils/Networks'

const networks = new Networks()
const bsc = new BSCDEX()
const polygon = new PolygonDEX()
const fantom = new FantomDEX()

const BLOCKCHAIN: string = process.env.VUE_APP_BLOCKCHAIN || ''
const BACKEND_URL: string = process.env.VUE_APP_BACKEND_URL || ''

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

function get0xSwapAPI(): string {
	switch (BLOCKCHAIN) {
		case 'bsc':
			return bsc.get0xSwapAPI()
		case 'polygon':
			return polygon.get0xSwapAPI()
		case 'fantom':
			return fantom.get0xSwapAPI()
		default:
			throw new Error('Unexpected network')
	}
}

async function getTokensList(): Promise<Array<Token>> {
	console.info(`Fetching tokens list from ${BACKEND_URL}/dex/tokens`)
	const result = await axios.get(`${BACKEND_URL}/dex/tokens`)
	const tokens = result.data.tokens.filter(
		(token: Token) => token.chainId === networks.getExpectedNetworkData().chainIdNumber
	)
	console.debug(`Found ${tokens.length} tokens`)
	return tokens
}

export { get0xSwapAPI, getTokensList, Token, EMPTY_TOKEN }
