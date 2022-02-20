import tokens from '@/config/constants/tokens'
import { getTokensList, Token } from '@/config/constants/dex'
import { Address } from '@/config/constants/types'
import { IDBPDatabase, openDB } from 'idb'
import { IERC20__factory } from '@artifacts/typechain'
import { BigNumber, ethers } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { Networks } from './Networks'
import { TokenAmount } from '@/models/dex/TokenAmount'

const TOKENS_STORE_NAME = 'tokens'

class TokensUtil {
	static initialized = false
	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''
	static BLOCKCHAIN: string = process.env.VUE_APP_BLOCKCHAIN || ''

	static getWBANAddress(): string {
		if (tokens && tokens.wban && tokens.wban.address) {
			return tokens.wban.address[TokensUtil.ENV_NAME as keyof Address]
		} else {
			throw new Error(`Can't find wBAN token in environment ${TokensUtil.ENV_NAME}`)
		}
	}

	static async loadTokensList(): Promise<void> {
		if (this.initialized) {
			console.info('IndexDB database already initialized')
			return
		}
		TokensUtil.initialized = true
		console.info('Initializing tokens database')
		const db: IDBPDatabase = await openDB('wBAN', 1, {
			upgrade(db) {
				console.debug('in IndexDB database upgrade')
				if (!db.objectStoreNames.contains(TOKENS_STORE_NAME)) {
					const store = db.createObjectStore(TOKENS_STORE_NAME)
					store.createIndex('symbol', 'symbol')
				}
			},
		})
		const tokens: Array<Token> = await getTokensList()
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]
			await db.put(TOKENS_STORE_NAME, token, token.address.toLowerCase())
		}
		// check if wBAN is whitelisted
		const wban = tokens.find((token) => token.symbol === 'wBAN')
		// add it
		if (!wban) {
			const wbanAddress = TokensUtil.getWBANAddress()
			const logo = await import(`../assets/wban-logo-${TokensUtil.BLOCKCHAIN}.svg`)
			const logoUrl = `${window.location.origin}${logo.default}`
			console.warn(`wBAN is not whitelisted in the DEX. Adding it at ${wbanAddress}`)
			await db.put(
				TOKENS_STORE_NAME,
				{
					name: 'Wrapped Banano',
					symbol: 'wBAN',
					address: wbanAddress,
					decimals: 18,
					logoURI: logoUrl,
					chainId: Networks.EXPECTED_CHAIN_ID,
				},
				TokensUtil.getWBANAddress().toLowerCase()
			)
		}
		db.close()
	}

	static async getToken(address: string): Promise<Token | undefined> {
		if (!TokensUtil.initialized) {
			await TokensUtil.loadTokensList()
		}
		console.info(`Searching for token "${address.toLowerCase()}"`)
		const db: IDBPDatabase = await openDB('wBAN')
		const token = db.get(TOKENS_STORE_NAME, address.toLowerCase())
		db.close()
		return token
	}

	static async getTokenBySymbol(symbol: string): Promise<Token | undefined> {
		if (!TokensUtil.initialized) {
			await TokensUtil.loadTokensList()
		}
		console.info(`Searching for token "${symbol.toLowerCase()}"`)
		const db: IDBPDatabase = await openDB('wBAN')
		const token = await db.getFromIndex(TOKENS_STORE_NAME, 'symbol', symbol)
		db.close()
		return token
	}

	static async filterTokens(search: string, owner: string, provider: Provider | null): Promise<Array<Token>> {
		const tokens = await TokensUtil.getAllTokens(owner, provider)
		return tokens.filter((token) => token.symbol.toLowerCase().includes(search.toLowerCase()))
	}

	static async getAllTokens(owner: string, provider: Provider | null): Promise<Array<Token>> {
		if (!TokensUtil.initialized) {
			await TokensUtil.loadTokensList()
		}
		const db: IDBPDatabase = await openDB('wBAN')
		const tokens: Array<Token> = (await db.getAll(TOKENS_STORE_NAME))
			// sort by alphabetical order
			.sort((a: Token, b: Token) =>
				a.symbol.localeCompare(b.symbol, undefined, {
					numeric: true,
					sensitivity: 'base',
				})
			)
		db.close()
		if (provider) {
			// filter by decreasing balance
			const tokenAmounts: Array<TokenAmount> = await Promise.all(
				tokens.map(async (token: Token) => {
					const balance = await this.getBalance(owner, token, provider)
					return {
						token: token,
						amount: balance.toString(),
					}
				})
			)
			return tokenAmounts
				.sort((a: TokenAmount, b: TokenAmount) => {
					if (a.amount !== '0' && b.amount !== '0') {
						return ethers.utils
							.parseUnits(a.amount, a.token.decimals)
							.gt(ethers.utils.parseUnits(b.amount, b.token.decimals))
							? -1
							: 1
					} else if (a.amount !== '0') {
						return -1
					} else if (b.amount !== '0') {
						return 1
					} else {
						return 0
					}
				})
				.map((tokenAmount) => tokenAmount.token)
		} else {
			// fallback to non sorted list
			return tokens
		}
	}

	static async getBalance(owner: string, token: Token, provider: Provider): Promise<BigNumber> {
		return IERC20__factory.connect(token.address, provider).balanceOf(owner)
	}
}

export default TokensUtil
