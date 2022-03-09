import { Networks } from '@/utils/Networks'
import TokensUtil from './TokensUtil'
import Accounts from '@/store/modules/accounts'

class MetaMask {
	static isMetaMask(): boolean {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ethereum = (window as any).ethereum
		return ethereum && ethereum.isMetaMask
	}

	static async addWBANToWallet(): Promise<void> {
		const chainName = Accounts.network?.network
		const logo = await import(`../assets/wban-logo-${chainName}.svg`)
		const logoUrl = `${window.location.origin}${logo.default}`
		MetaMask.addTokenToWallet(TokensUtil.getWBANAddress(), 'wBAN', 18, logoUrl)
	}

	static async addTokenToWallet(address: string, symbol: string, decimals: number, logoURI: string): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ethereum = (window as any).ethereum
		await ethereum.request({
			method: 'wallet_watchAsset',
			params: {
				type: 'ERC20',
				options: {
					address: address,
					symbol: symbol,
					decimals: decimals,
					image: logoURI,
				},
			},
		})
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static async addCustomNetwork(chainId: string): Promise<any> {
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
						iconUrls: network.iconUrls,
					},
				],
			})
		} else {
			console.debug(`Not MetaMask. Skipping...`)
		}
	}
}

/*
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
*/

export default MetaMask
