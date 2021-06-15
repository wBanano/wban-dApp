import bsc from './bsc/tokens'
import polygon from './polygon/tokens'
import { TokensList } from './types'

const bscTokens: TokensList = bsc
const polygonTokens: TokensList = polygon

const BLOCKCHAIN: string = process.env.VUE_APP_BLOCKCHAIN || ''

let tokens: TokensList = {}

switch (BLOCKCHAIN) {
	case 'bsc':
		tokens = bscTokens
		break
	case 'polygon':
		tokens = polygonTokens
		break
	default:
		console.warn('Unexpected network')
}

export default tokens
