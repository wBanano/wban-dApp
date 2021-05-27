import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import store from '@/store'
import { BigNumber, ethers } from 'ethers'
// @ts-ignore
import WalletProvider from '@libertypie/wallet-provider'
import MetaMask from '@/utils/MetaMask'
import { Networks } from '@/utils/Networks'

@Module({
	namespaced: true,
	name: 'accounts',
	store,
	dynamic: true
})
class AccountsModule extends VuexModule {
	public activeAccount: string | null = null
	public activeBalance = 0
	public chainId: string | null = null
	public chainName: string | null = null
	public blockExplorerUrl: string | null = null
	private _providerEthers: ethers.providers.JsonRpcProvider | null = null // this is "provider" for Ethers.js
	public isConnected = false
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _walletProvider: any
	private _isInitialized = false

	static BSC_EXPECTED_CHAIN_ID: string = process.env.VUE_APP_BSC_EXPECTED_CHAIN_ID || ''

	get isUserConnected() {
		return this.isConnected
	}

	get activeBalanceBnb() {
		return ethers.utils.formatEther(this.activeBalance)
	}

	get providerEthers() {
		return this._providerEthers
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get walletProvider(): any {
		return this._walletProvider
	}

	get isInitialized(): boolean {
		return this._isInitialized
	}

	@Mutation
	async disconnectWallet() {
		this.activeAccount = null
		this.activeBalance = 0
		this._providerEthers = null
		await this._walletProvider.removeProviderCache()
		this._walletProvider = null

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
	setChainData(chainId: string) {
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
	setWalletProvider(walletProvider: any) {
		this._walletProvider = walletProvider
	}

	@Mutation
	setInitialized(initialized: boolean) {
		this._isInitialized = initialized
	}

	@Action
	async initWalletProvider() {
		console.debug('in initWalletProvider')

		if (!this._isInitialized) {
			const walletProvider = new WalletProvider({
				modalTitle: 'Choose your wallet',
				cacheProvider: true,
				providers: {
					// eslint-disable-next-line @typescript-eslint/camelcase
					web3_wallets: {
						// eslint-disable-next-line @typescript-eslint/camelcase
						connect_text: 'Connect with Metamask or Brave'
					}
				},
				debug: true
			})

			this.context.commit('setWalletProvider', walletProvider)

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
		const connectStatus = await this.context.getters.walletProvider.connect()
		if (connectStatus.isError()) {
			//some error info
			return
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const resultInfo: any = connectStatus.getData()
		const provider = resultInfo.provider

		if (resultInfo.chainId == AccountsModule.BSC_EXPECTED_CHAIN_ID) {
			this.context.commit('setIsConnected', true)
			this.context.commit('setActiveAccount', resultInfo.account)
			this.context.commit('setChainData', resultInfo.chainId)
			this.context.commit('setEthersProvider', provider)
			this.context.dispatch('fetchActiveBalance')
		} else {
			this.context.commit('setIsConnected', false)
			MetaMask.switchToBSC().onOk(async () => {
				await MetaMask.addCustomNetwork(AccountsModule.BSC_EXPECTED_CHAIN_ID)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const resultInfo: any = connectStatus.getData()
				const provider = resultInfo.provider
				this.context.commit('setIsConnected', true)
				this.context.commit('setActiveAccount', resultInfo.account)
				this.context.commit('setChainData', resultInfo.chainId)
				this.context.commit('setEthersProvider', provider)
				this.context.dispatch('fetchActiveBalance')
			})
		}
	}

	@Action
	async disconnectWalletProvider() {
		console.debug('in disconnectWalletProvider')
		this.context.commit('disconnectWallet')
		this.context.commit('setIsConnected', false)
	}

	@Action
	async ethereumListener() {
		console.debug('in ethereumListener')
		if (this.isConnected) {
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			window.ethereum.on('accountsChanged', (accounts: any) => {
				if (this.isConnected) {
					this.context.commit('setActiveAccount', accounts[0])
					// this.context.commit('setEthersProvider', this.providerW3m)
					this.context.dispatch('fetchActiveBalance')
				}
			})
			// @ts-ignore
			window.ethereum.on('chainChanged', (chainId: string) => {
				this.context.commit('setChainData', chainId)
				// this.context.commit('setEthersProvider', this.providerW3m)
				this.context.dispatch('fetchActiveBalance')
			})
		}
	}

	@Action
	async fetchActiveBalance() {
		console.debug('in fetchActiveBalance')
		let balance: BigNumber = BigNumber.from(0)
		if (this.providerEthers != null && this.activeAccount != null) {
			balance = await this.providerEthers.getBalance(this.activeAccount)
			console.info(`Balance is ${ethers.utils.formatEther(balance)} BNB`)
		} else {
			console.error('Could not get balance')
		}
		this.context.commit('setActiveBalance', balance)
	}

	@Action
	async addWBANTokenToMetaMask() {
		return MetaMask.addWBANToken()
	}
}

export default getModule(AccountsModule)
export const Contracts: BindingHelpers = namespace('accounts')
