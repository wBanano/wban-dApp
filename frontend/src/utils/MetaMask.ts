import { Networks } from '@/utils/Networks'
import { Dialog } from 'quasar'

class MetaMask {
	static WBAN_CONTRACT_ADDRESS: string = process.env.VUE_APP_WBAN_CONTRACT || ''

	static isMetaMask(): boolean {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ethereum = (window as any).ethereum
		return ethereum && ethereum.isMetaMask
	}

	static async addWBANToken(): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ethereum = (window as any).ethereum
		const logoUrl = `${window.location.origin}/wban-logo.svg`
		if (MetaMask.isMetaMask()) {
			await ethereum.request({
				method: 'wallet_watchAsset',
				params: {
					type: 'ERC20',
					options: {
						address: MetaMask.WBAN_CONTRACT_ADDRESS,
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
	static switchToBSC(): any {
		return Dialog.create({
			dark: true,
			title: 'Wrong Network',
			message: `Please connect to appropriate Binance Smart Chain network.`,
			ok: {
				label: 'Switch network',
				color: 'primary',
				'text-color': 'secondary'
			}
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
				params: [network]
			})
		} else {
			console.debug(`Not MetaMask. Skipping...`)
		}
	}
}

export default MetaMask
