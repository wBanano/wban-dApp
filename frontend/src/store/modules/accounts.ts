import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import store from '@/store'
import { BigNumber, ethers } from 'ethers'
import Onboard from 'bnc-onboard'
import MetaMask from '@/utils/MetaMask'
import { Networks } from '@/utils/Networks'

@Module({
	namespaced: true,
	name: 'accounts',
	store,
	dynamic: true,
})
class AccountsModule extends VuexModule {
	public activeAccount: string | null = null
	public activeBalance = 0
	public chainId: number | null = null
	public chainName: string | null = null
	public blockExplorerUrl: string | null = null
	private _providerEthers: ethers.providers.JsonRpcProvider | null = null // this is "provider" for Ethers.js
	public isConnected = false
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _onboard: any
	private _isInitialized = false

	static EXPECTED_CHAIN_ID = Number.parseInt(process.env.VUE_APP_EXPECTED_CHAIN_ID || '')

	get isUserConnected() {
		return this.isConnected
	}

	get activeCryptoBalance() {
		return ethers.utils.formatEther(this.activeBalance)
	}

	get providerEthers() {
		return this._providerEthers
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get walletProvider(): any {
		return this._onboard
	}

	get isInitialized(): boolean {
		return this._isInitialized
	}

	@Mutation
	async disconnectWallet() {
		window.localStorage.removeItem('selectedWallet')
		const onboard = this.context.getters.walletProvider
		onboard.walletReset()
		this.activeAccount = null
		this.activeBalance = 0
		this._providerEthers = null
		this._onboard = null

		window.location.href = '../' // redirect to the Main page
	}

	@Mutation
	setActiveAccount(selectedAddress: string) {
		this.activeAccount = selectedAddress
	}

	@Mutation
	setActiveBalance(balance: number) {
		this.activeBalance = balance
	}

	@Mutation
	setChainData(chainId: number) {
		this.chainId = chainId
		const networks = new Networks()
		const networkData = networks.getNetworkData(chainId)
		if (!networkData) {
			return
		}
		this.chainName = networkData.chainName
		this.blockExplorerUrl = networkData.blockExplorerUrls[0]
	}

	@Mutation
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async setEthersProvider(provider: any) {
		this._providerEthers = new ethers.providers.Web3Provider(provider)
	}

	@Mutation
	setIsConnected(isConnected: boolean) {
		this.isConnected = isConnected
		// add to persistent storage so that the user can be logged back in when revisiting website
		localStorage.setItem('isConnected', isConnected.toString())
	}

	@Mutation
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setWalletProvider(onboard: any) {
		this._onboard = onboard
	}

	@Mutation
	setInitialized(initialized: boolean) {
		this._isInitialized = initialized
	}

	@Action
	async initWalletProvider() {
		console.debug('in initWalletProvider')

		if (!this._isInitialized) {
			const networks = new Networks()
			const RPC_URL = networks.getExpectedNetworkData().rpcUrls[0]
			// common wallets for all networks
			const defaultWallets = [
				{ walletName: 'metamask', preferred: true },
				{ walletName: 'trust', preferred: true, rpcUrl: RPC_URL },
				{ walletName: 'coinbase' },
				{
					walletName: 'walletConnect',
					rpc: {
						'56': networks.getNetworkData(56)?.rpcUrls[0] || '',
						'97': networks.getNetworkData(97)?.rpcUrls[0] || '',
						'137': networks.getNetworkData(137)?.rpcUrls[0] || '',
						'250': networks.getNetworkData(250)?.rpcUrls[0] || '',
						'4002': networks.getNetworkData(4002)?.rpcUrls[0] || '',
						'80001': networks.getNetworkData(80001)?.rpcUrls[0] || '',
					},
				},
				{ walletName: 'opera' },
				{ walletName: 'operaTouch' },
			]
			const wallets = defaultWallets
			// only allow Binance Chain Wallet for BSC networks
			if (AccountsModule.EXPECTED_CHAIN_ID === 56 || AccountsModule.EXPECTED_CHAIN_ID === 97) {
				wallets.push({ walletName: 'binance', preferred: true })
			}
			const onboard = Onboard({
				dappId: process.env.VUE_APP_ONBOARD_DAPP_ID || '',
				networkId: AccountsModule.EXPECTED_CHAIN_ID,
				networkName: networks.getNetworkData(AccountsModule.EXPECTED_CHAIN_ID)?.chainName,
				darkMode: true,
				hideBranding: true,
				walletSelect: {
					description: 'Please select a wallet to connect to wBAN bridge:',
					wallets,
				},
				walletCheck: [
					{ checkName: 'derivationPath' },
					{ checkName: 'accounts' },
					{ checkName: 'connect' },
					{ checkName: 'network' },
				],
				subscriptions: {
					address: async (address) => {
						console.debug(`Address: ${address}`)
						this.context.commit('setActiveAccount', address)
					},
					network: async (network) => {
						console.debug(`Blockchain network: ${ethers.utils.hexlify(network)}`)
						// create network if missing
						if (network !== AccountsModule.EXPECTED_CHAIN_ID) {
							await MetaMask.addCustomNetwork(AccountsModule.EXPECTED_CHAIN_ID)
						}
					},
					wallet: (wallet) => {
						if (wallet !== undefined) {
							this.context.commit('setEthersProvider', wallet.provider)
							// store the selected wallet name to be retrieved next time the app loads
							if (wallet.name) {
								window.localStorage.setItem('selectedWallet', wallet.name)
							}
						}
					},
				},
			})
			this.context.commit('setWalletProvider', onboard)

			// if the user is flagged as already connected, automatically connect back to Web3Modal
			if (localStorage.getItem('isConnected') === 'true') {
				// This will get deprecated soon. Setting it to false removes a warning from the console.
				// @ts-ignore
				window.ethereum.autoRefreshOnNetworkChange = false
				await this.connectWalletProvider()
			}

			this.context.commit('setInitialized', true)
		}
	}

	@Action
	async connectWalletProvider() {
		console.debug('in connectWalletProvider')

		const onboard = this.context.getters.walletProvider

		// get the selectedWallet value from local storage
		const previouslySelectedWallet = window.localStorage.getItem('selectedWallet')
		// call wallet select with that value if it exists
		if (previouslySelectedWallet != null) {
			await onboard.walletSelect(previouslySelectedWallet)
		} else {
			await onboard.walletSelect()
		}
		const readyToTransact = await onboard.walletCheck()

		if (readyToTransact) {
			const currentState = onboard.getState()
			this.context.commit('setIsConnected', true)
			this.context.commit('setChainData', currentState.appNetworkId)
			this.context.dispatch('fetchActiveBalance')
		} else {
			this.context.commit('setIsConnected', false)
		}
	}

	@Action
	async disconnectWalletProvider() {
		console.debug('in disconnectWalletProvider')
		this.context.commit('disconnectWallet')
		this.context.commit('setIsConnected', false)
	}

	@Action
	async fetchActiveBalance() {
		console.debug('in fetchActiveBalance')
		let balance: BigNumber = BigNumber.from(0)
		if (this.providerEthers != null && this.activeAccount != null) {
			balance = await this.providerEthers.getBalance(this.activeAccount)
			console.info(`Crypto balance is ${ethers.utils.formatEther(balance)}`)
		} else {
			console.error('Could not get balance')
		}
		this.context.commit('setActiveBalance', balance)
	}

	@Action
	async addWBANTokenToMetaMask() {
		return MetaMask.addWBANToWallet()
	}
}

export default getModule(AccountsModule)
export const Contracts: BindingHelpers = namespace('accounts')
