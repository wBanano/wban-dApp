import { Token, EMPTY_TOKEN } from '@/config/constants/dex'

type TokenAmount = {
	amount: string
	token: Token
}

function emptyTokenAmount(): TokenAmount {
	return {
		amount: '',
		token: Object.assign({}, EMPTY_TOKEN),
	}
}

export { TokenAmount, emptyTokenAmount }
