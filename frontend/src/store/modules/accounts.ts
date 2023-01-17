import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import store from '@/store'
import { BigNumber, ethers } from 'ethers'
import MetaMask from '@/utils/MetaMask'
import {
	BSC_MAINNET,
	POLYGON_MAINNET,
	FANTOM_MAINNET,
	ETHEREUM_MAINNET,
	ARBITRUM_MAINNET,
	Network,
	Networks,
} from '@/utils/Networks'
import Onboard, { OnboardAPI, WalletState } from '@web3-onboard/core'
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule from '@web3-onboard/walletconnect'
import ledgerModule from '@web3-onboard/ledger'
import coinbaseWalletModule from '@web3-onboard/coinbase'
import enrkypt from '@web3-onboard/enkrypt'
import Dialogs from '@/utils/Dialogs'
import i18n from '@/i18n'
import translationDE from '@/web3-onboard/web3-onboard-de.json'
import translationEN from '@/web3-onboard/web3-onboard-en.json'
import translationES from '@/web3-onboard/web3-onboard-es.json'
import translationFR from '@/web3-onboard/web3-onboard-fr.json'
// import translationHI from '@/web3-onboard/web3-onboard-hi.json'
import translationID from '@/web3-onboard/web3-onboard-id.json'
import translationIT from '@/web3-onboard/web3-onboard-it.json'
import translationNL from '@/web3-onboard/web3-onboard-nl.json'
import translationPTBR from '@/web3-onboard/web3-onboard-pt-BR.json'
import translationRU from '@/web3-onboard/web3-onboard-ru.json'
import translationTR from '@/web3-onboard/web3-onboard-tr.json'
import translationUK from '@/web3-onboard/web3-onboard-uk.json'
import translationVI from '@/web3-onboard/web3-onboard-vi.json'

@Module({
	namespaced: true,
	name: 'accounts',
	store,
	dynamic: true,
})
class AccountsModule extends VuexModule {
	public activeAccount: string | null = null
	public activeBalance = BigNumber.from(0)
	public network: Network = POLYGON_MAINNET
	private _providerEthers: ethers.providers.Web3Provider | null = null // this is "provider" for Ethers.js
	public isConnected = false
	private _onboard: OnboardAPI | undefined = undefined
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _subscription: any
	private _isInitialized = false
	private _language = 'en'

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
	setActiveBalance(balance: BigNumber) {
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
	setLanguage(language: string) {
		this._language = language
	}

	@Mutation
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	updateNetworkData(update: any) {
		console.debug('in updateNetworkData')

		const oldAccount = this.activeAccount
		const oldNetworkChainId = this.network.chainId

		if (update.wallets.length > 0) {
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
		} else {
			console.warn('No wallet selected')
		}
	}

	@Mutation
	async disconnectWallet() {
		window.localStorage.removeItem('selectedWallet')
		// disconnect the first wallet in the wallets array
		if (this._onboard) {
			const [primaryWallet] = this._onboard.state.get().wallets
			await this._onboard.disconnectWallet({ label: primaryWallet.label })
		}
		window.localStorage.removeItem('-walletlink:https://www.walletlink.org:session:id')
		window.localStorage.removeItem('-walletlink:https://www.walletlink.org:session:secret')
		window.localStorage.removeItem('-walletlink:https://www.walletlink.org:session:linked')
		window.localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE')
		this.activeAccount = null
		this.activeBalance = BigNumber.from(0)
		this._providerEthers = null
		// unsubscribe when updates are no longer needed
		this._subscription.unsubscribe()
		window.location.href = '../' // redirect to the Main page
	}

	@Action
	async initWalletProvider() {
		console.debug('in initWalletProvider')
		if (this._isInitialized && this._language === i18n.locale) {
			return
		}
		this.context.commit('setInitialized', true)
		const injected = injectedModule()
		const walletConnect = walletConnectModule({
			qrcodeModalOptions: {
				mobileLinks: ['metamask', 'rainbow', 'trust'],
			},
			connectFirstChainId: false,
		})
		const ledger = ledgerModule()
		const coinbaseWalletSdk = coinbaseWalletModule({ darkMode: true })
		const enrkyptModule = enrkypt()
		const mainnetChains = [
			{
				id: BSC_MAINNET.chainId,
				token: BSC_MAINNET.nativeCurrency.symbol,
				label: BSC_MAINNET.chainName,
				rpcUrl: BSC_MAINNET.rpcUrls[0],
				blockExplorerUrl: BSC_MAINNET.blockExplorerUrls[0],
			},
			{
				id: POLYGON_MAINNET.chainId,
				token: POLYGON_MAINNET.nativeCurrency.symbol,
				label: POLYGON_MAINNET.chainName,
				rpcUrl: POLYGON_MAINNET.rpcUrls[0],
				blockExplorerUrl: POLYGON_MAINNET.blockExplorerUrls[0],
			},
			{
				id: FANTOM_MAINNET.chainId,
				token: FANTOM_MAINNET.nativeCurrency.symbol,
				label: FANTOM_MAINNET.chainName,
				rpcUrl: FANTOM_MAINNET.rpcUrls[0],
				blockExplorerUrl: FANTOM_MAINNET.blockExplorerUrls[0],
			},
			{
				id: ETHEREUM_MAINNET.chainId,
				token: ETHEREUM_MAINNET.nativeCurrency.symbol,
				label: ETHEREUM_MAINNET.chainName,
				rpcUrl: ETHEREUM_MAINNET.rpcUrls[0],
				blockExplorerUrl: ETHEREUM_MAINNET.blockExplorerUrls[0],
			},
			{
				id: ARBITRUM_MAINNET.chainId,
				token: ARBITRUM_MAINNET.nativeCurrency.symbol,
				label: ARBITRUM_MAINNET.chainName,
				rpcUrl: ARBITRUM_MAINNET.rpcUrls[0],
				blockExplorerUrl: ARBITRUM_MAINNET.blockExplorerUrls[0],
			},
		]
		const testnetSelected = process.env.VUE_APP_TESTNET
		let testnet = undefined
		if (testnetSelected) {
			const networks = new Networks()
			const selected = networks.getNetworkData(testnetSelected)
			if (selected) {
				testnet = {
					id: selected.chainId,
					token: selected.nativeCurrency.symbol,
					label: selected.chainName,
					rpcUrl: selected.rpcUrls[0],
				}
			}
		}
		let translation = translationEN
		switch (i18n.locale) {
			case 'de':
				translation = translationDE
				break
			case 'es':
				translation = translationES
				break
			case 'fr':
				translation = translationFR
				break
			/*
			case 'hi':
				translation = translationHI
				break
			*/
			case 'id':
				translation = translationID
				break
			case 'it':
				translation = translationIT
				break
			case 'nl':
				translation = translationNL
				break
			case 'pt-BR':
				translation = translationPTBR
				break
			case 'ru':
				translation = translationRU
				break
			case 'tr':
				translation = translationTR
				break
			case 'uk':
				translation = translationUK
				break
			case 'vi':
				translation = translationVI
				break
		}
		if (this._onboard) {
			this.disconnectWalletProvider()
		}
		this._onboard = Onboard({
			wallets: [injected, walletConnect, ledger, coinbaseWalletSdk, enrkyptModule],
			chains: testnet ? [...mainnetChains, testnet] : mainnetChains,
			appMetadata: {
				name: 'Wrapped Banano',
				icon: require(`@/assets/wban-logo-${this.network.network}.svg`),
				logo: require(`@/assets/wban-logo-${this.network.network}.svg`),
				description: 'Wrapped Banano',
				recommendedInjectedWallets: [
					{ name: 'MetaMask', url: 'https://metamask.io' },
					{ name: 'Rabby', url: 'https://rabby.io' },
					{ name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
				],
			},
			i18n: {
				en: translation,
			},
			accountCenter: {
				desktop: {
					enabled: false,
				},
				mobile: {
					enabled: false,
				},
			},
		})
		this.context.commit('setLanguage', i18n.locale)

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

	@Action
	async connectWalletProvider(wantedChain?: string) {
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
				// check if the user is connected to a supported network
				const chainId = wallets[0].chains[0].id
				if (!new Networks().getSupportedNetworks().find((network) => network.chainId === chainId)) {
					console.warn(`Unsupported blockchain network: ${chainId}. Asking for a switch to Polygon.`)
					const switched = await this._onboard?.setChain({ chainId: POLYGON_MAINNET.chainId })
					if (!switched) {
						await Dialogs.showUnsupportedNetwork(chainId)
						await this.disconnectWalletProvider()
						return
					}
				}
				// check if the user is connected to the wanted network
				if (wantedChain) {
					const switched = await this._onboard?.setChain({ chainId: wantedChain ?? POLYGON_MAINNET.chainId })
					if (!switched) {
						return
					}
				}
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
