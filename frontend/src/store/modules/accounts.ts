import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import store from '@/store'
import { BigNumber, ethers } from 'ethers'
import MetaMask from '@/utils/MetaMask'
import { BSC_MAINNET, POLYGON_MAINNET, FANTOM_MAINNET, Network, Networks } from '@/utils/Networks'
import Onboard, { OnboardAPI, WalletState } from '@web3-onboard/core'
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule from '@web3-onboard/walletconnect'
import ledgerModule from '@web3-onboard/ledger'
import gnosisModule from '@web3-onboard/gnosis'

@Module({
	namespaced: true,
	name: 'accounts',
	store,
	dynamic: true,
})
class AccountsModule extends VuexModule {
	public activeAccount: string | null = null
	public activeBalance = 0
	public network: Network = POLYGON_MAINNET
	private _providerEthers: ethers.providers.Web3Provider | null = null // this is "provider" for Ethers.js
	public isConnected = false
	private _onboard: OnboardAPI | undefined = undefined
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _subscription: any
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

	get isInitialized(): boolean {
		return this._isInitialized
	}

	@Mutation
	setActiveBalance(balance: number) {
		this.activeBalance = balance
	}

	@Mutation
	setIsConnected(isConnected: boolean) {
		this.isConnected = isConnected
		// add to persistent storage so that the user can be logged back in when revisiting website
		localStorage.setItem('isConnected', isConnected.toString())
	}

	@Mutation
	setInitialized(initialized: boolean) {
		this._isInitialized = initialized
	}

	@Mutation
	setNetwork(network: Network) {
		this.network = network
	}

	@Mutation
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setSubscription(subscription: any) {
		this._subscription = subscription
	}

	@Mutation
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	updateNetworkData(update: any) {
		console.debug('in updateNetworkData')

		const oldAccount = this.activeAccount
		const oldNetworkChainId = this.network.chainId

		const wallet = update.wallets[0]
		this.activeAccount = wallet.accounts[0].address
		this._providerEthers = new ethers.providers.Web3Provider(wallet.provider)
		const chainId = wallet.chains[0].id
		console.debug(`Switched to chain ${chainId}`)
		this.network = new Networks().getNetworkData(chainId) ?? POLYGON_MAINNET
		window.localStorage.setItem(
			'selectedWallet',
			JSON.stringify(update.wallets.map((wallet: WalletState) => wallet.label))
		)
		window.localStorage.setItem('selectedBlockchain', chainId)

		// only emit event if network or connected address was changed
		if (this.activeAccount !== oldAccount || oldNetworkChainId !== chainId) {
			document.dispatchEvent(new CustomEvent('web3-connection'))
		}
	}

	@Mutation
	async disconnectWallet() {
		window.localStorage.removeItem('selectedWallet')
		// disconnect the first wallet in the wallets array
		// const [primaryWallet] = this._onboard?.state.get().wallets
		// await this._onboard?.disconnectWallet({ label: primaryWallet.label })
		this.activeAccount = null
		this.activeBalance = 0
		this._providerEthers = null
		// unsubscribe when updates are no longer needed
		this._subscription.unsubscribe()
		window.location.href = '../' // redirect to the Main page
	}

	@Action
	async initWalletProvider() {
		console.debug('in initWalletProvider')
		if (!this._isInitialized) {
			this.context.commit('setInitialized', true)
			const injected = injectedModule()
			const walletConnect = walletConnectModule()
			const ledger = ledgerModule()
			const gnosis = gnosisModule()
			this._onboard = Onboard({
				wallets: [injected, walletConnect, ledger, gnosis],
				chains: [
					{
						id: BSC_MAINNET.chainId,
						token: BSC_MAINNET.nativeCurrency.symbol,
						label: BSC_MAINNET.chainName,
						rpcUrl: BSC_MAINNET.rpcUrls[0],
					},
					{
						id: POLYGON_MAINNET.chainId,
						token: POLYGON_MAINNET.nativeCurrency.symbol,
						label: POLYGON_MAINNET.chainName,
						rpcUrl: POLYGON_MAINNET.rpcUrls[0],
					},
					{
						id: FANTOM_MAINNET.chainId,
						token: FANTOM_MAINNET.nativeCurrency.symbol,
						label: FANTOM_MAINNET.chainName,
						rpcUrl: FANTOM_MAINNET.rpcUrls[0],
					},
				],
				appMetadata: {
					name: 'Wrapped Banano',
					icon: require(`@/assets/wban-logo-${this.network.network}.svg`),
					logo: require(`@/assets/wban-logo-${this.network.network}.svg`),
					description: 'Wrapped Banano',
					recommendedInjectedWallets: [
						{ name: 'MetaMask', url: 'https://metamask.io' },
						{ name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
					],
				},
			})

			const state = this._onboard.state.select()
			const subscription = state.subscribe((update) => {
				this.context.commit('updateNetworkData', update)
				this.context.dispatch('fetchActiveBalance')
			})
			this.context.commit('setSubscription', subscription)

			const previouslyConnectedBlockchain = window.localStorage.getItem('selectedBlockchain')
			if (previouslyConnectedBlockchain) {
				const network = new Networks().getNetworkData(previouslyConnectedBlockchain) ?? POLYGON_MAINNET
				this.context.commit('setNetwork', network)
			}

			const previouslyConnectedWallets = window.localStorage.getItem('selectedWallet')
			if (previouslyConnectedWallets != null && previouslyConnectedWallets !== '') {
				await this.connectWalletProvider()
			}
		}
	}

	@Action
	async connectWalletProvider() {
		console.debug('in connectWalletProvider')

		if (!this._onboard) {
			throw new Error('Web3 provider not initialized')
		}

		const previouslyConnectedWallets = window.localStorage.getItem('selectedWallet')

		if (previouslyConnectedWallets != null && previouslyConnectedWallets !== '') {
			console.debug('Found existing wallet... Reconnecting...')
			// connect the most recently connected wallet (first in the array)
			await this._onboard.connectWallet({
				autoSelect: { label: JSON.parse(previouslyConnectedWallets)[0], disableModals: true },
			})
			const previouslyConnectedBlockchain = window.localStorage.getItem('selectedBlockchain')
			if (previouslyConnectedBlockchain) {
				await this._onboard.setChain({ chainId: previouslyConnectedBlockchain })
			}
			this.context.commit('setIsConnected', true)
		} else {
			try {
				const wallets = await this._onboard.connectWallet()
				this.context.commit('setIsConnected', wallets.length > 0)
			} catch (err) {
				console.error('Unsupported blockchain?', err)
			}
		}
	}

	@Action
	async switchBlockchain(network: Network) {
		this._onboard?.setChain({
			chainId: network.chainId,
		})
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
