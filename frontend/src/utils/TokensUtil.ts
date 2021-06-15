import tokens from '@/config/constants/tokens'
import { Address } from '@/config/constants/types'

class TokensUtil {
	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	static getWBANAddress(): string {
		if (tokens && tokens.wban && tokens.wban.address) {
			return tokens.wban.address[TokensUtil.ENV_NAME as keyof Address]
		} else {
			throw new Error(`Can't find wBAN token in environment ${TokensUtil.ENV_NAME}`)
		}
	}
}

export default TokensUtil
