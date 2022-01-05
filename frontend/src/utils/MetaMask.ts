import { Networks } from '@/utils/Networks'
import TokensUtil from './TokensUtil'

class MetaMask {
	static BLOCKCHAIN: string = process.env.VUE_APP_BLOCKCHAIN || ''

	static isMetaMask(): boolean {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ethereum = (window as any).ethereum
		return ethereum && ethereum.isMetaMask
	}

	static async addWBANToken(): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ethereum = (window as any).ethereum
		const logo = await import(`../assets/wban-logo-${MetaMask.BLOCKCHAIN}.svg`)
		const logoUrl = `${window.location.origin}${logo.default}`
		console.warn(logoUrl)
		if (MetaMask.isMetaMask()) {
			await ethereum.request({
				method: 'wallet_watchAsset',
				params: {
					type: 'ERC20',
					options: {
						address: TokensUtil.getWBANAddress(),
						symbol: 'wBAN',
						decimals: 18,
						image: logoUrl
					}
				}
			})
		} else {
			console.debug(`Not MetaMask. Skipping...`)
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static async addCustomNetwork(chainId: number): Promise<any> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ethereum = (window as any).ethereum
		const network = new Networks().getNetworkData(chainId)
		if (MetaMask.isMetaMask() && network) {
			console.debug(`About to add custom network "${network.chainName}" with chainId: ${chainId}`)
			return ethereum.request({
				method: 'wallet_addEthereumChain',
				params: [
					{
						chainId: network.chainId,
						chainName: network.chainName,
						nativeCurrency: network.nativeCurrency,
						rpcUrls: network.rpcUrls,
						blockExplorerUrls: network.blockExplorerUrls,
						iconUrls: network.iconUrls
					}
				]
			})
		} else {
			console.debug(`Not MetaMask. Skipping...`)
		}
	}
}

interface AddEthereumChainParameter {
	chainId: string
	chainName: string
	nativeCurrency: {
		name: string
		symbol: string // 2-6 characters long
		decimals: 18
	}
	rpcUrls: string[]
	blockExplorerUrls: string[]
	iconUrls?: string[] // Currently ignored.
}

export default MetaMask
