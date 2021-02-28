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
}

export default MetaMask
