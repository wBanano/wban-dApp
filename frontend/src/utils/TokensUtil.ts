import { getTokens } from '@/config/constants/tokens'
import { getTokensList, Token } from '@/config/constants/dex'
import { Address } from '@/config/constants/types'
import { IDBPDatabase, openDB } from 'idb'
import { IERC20__factory } from '@artifacts/typechain'
import { BigNumber } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { POLYGON_MAINNET } from './Networks'
import Accounts from '@/store/modules/accounts'

const TOKENS_STORE_NAME = 'tokens'
const DB_VERSION = 2

class TokensUtil {
	static initialized = false
	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	static getWBANAddress(): string {
		const tokens = getTokens()
		if (tokens && tokens.wban && tokens.wban.address) {
			return tokens.wban.address[TokensUtil.ENV_NAME as keyof Address]
		} else {
			throw new Error(`Can't find wBAN token in environment ${TokensUtil.ENV_NAME}`)
		}
	}

	static isWBAN(token: string): boolean {
		return TokensUtil.getWBANAddress().toLowerCase() === token.toLowerCase()
	}

	static async loadTokensList(): Promise<void> {
		if (TokensUtil.initialized) {
			console.info('IndexDB database already initialized')
			return
		}
		console.info('Initializing tokens database')
		const db: IDBPDatabase = await openDB(Accounts.network.network, DB_VERSION, {
			upgrade(db) {
				console.debug('in IndexDB database upgrade')
				if (!db.objectStoreNames.contains(TOKENS_STORE_NAME)) {
					const store = db.createObjectStore(TOKENS_STORE_NAME)
					store.createIndex('symbol', 'symbol')
				}
			},
		})
		const tokens: Array<Token> = await getTokensList()
		const tx = db.transaction(TOKENS_STORE_NAME, 'readwrite')
		await Promise.all(tokens.map((token) => tx.store.put(token, token.address.toLowerCase())))
		await tx.done
		// check if wBAN is whitelisted
		const wban = tokens.find((token) => token.symbol === 'wBAN')
		// add it
		if (!wban) {
			const chainName = Accounts.network?.network
			const wbanAddress = TokensUtil.getWBANAddress()
			const logo = await import(`../assets/wban-logo-${chainName}.svg`)
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
					chainId: POLYGON_MAINNET.chainId,
				},
				TokensUtil.getWBANAddress().toLowerCase()
			)
		}
		db.close()
		TokensUtil.initialized = true
	}

	static async getToken(address: string): Promise<Token | undefined> {
		if (!TokensUtil.initialized) {
			await TokensUtil.loadTokensList()
		}
		console.info(`Searching for token "${address.toLowerCase()}"`)
		const db: IDBPDatabase = await openDB(Accounts.network.network)
		const token = db.get(TOKENS_STORE_NAME, address.toLowerCase())
		db.close()
		return token
	}

	static async getTokenBySymbol(symbol: string): Promise<Array<Token> | undefined> {
		if (!TokensUtil.initialized) {
			await TokensUtil.loadTokensList()
		}
		console.info(`Searching for token "${symbol.toLowerCase()}"`)
		const db: IDBPDatabase = await openDB(Accounts.network.network)
		const tokens: Token[] = await db.getAllFromIndex(TOKENS_STORE_NAME, 'symbol', symbol)
		db.close()
		return tokens
	}

	static async filterTokens(search: string): Promise<Array<Token>> {
		const tokens = await TokensUtil.getAllTokens()
		return tokens.filter((token) => token.symbol.toLowerCase().includes(search.toLowerCase()))
	}

	static async getAllTokens() {
		if (!TokensUtil.initialized) {
			await TokensUtil.loadTokensList()
		}
		const db: IDBPDatabase = await openDB(Accounts.network.network)
		const tokens: Array<Token> = (await db.getAll(TOKENS_STORE_NAME))
			// sort by alphabetical order
			.sort((a: Token, b: Token) =>
				a.symbol.localeCompare(b.symbol, undefined, {
					numeric: true,
					sensitivity: 'base',
				})
			)
		db.close()
		return tokens
	}

	static async getBalance(owner: string, token: Token, provider: Provider): Promise<BigNumber> {
		if (token.address) {
			return IERC20__factory.connect(token.address, provider).balanceOf(owner)
		} else {
			return provider.getBalance(owner)
		}
	}
}

export default TokensUtil
