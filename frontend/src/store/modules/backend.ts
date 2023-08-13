import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import router from '@/router'
import store from '@/store'
// eslint-disable-next-line import/no-named-as-default
import Contracts from '@/store/modules/contracts'
import Accounts from '@/store/modules/accounts'
import plausible from '@/store/modules/plausible'
import axios, { AxiosResponse } from 'axios'
import { BigNumber, ethers, Signature } from 'ethers'
import { ClaimRequest } from '@/models/ClaimRequest'
import { SwapRequest } from '@/models/SwapRequest'
import { SwapResponse } from '@/models/SwapResponse'
import { WithdrawRequest } from '@/models/WithdrawRequest'
import { WithdrawResponse } from '@/models/WithdrawResponse'
import { ClaimResponse, ClaimResponseResult } from '@/models/ClaimResponse'
import { HistoryRequest } from '@/models/HistoryRequest'
import { GaslessSettings } from '@/models/GaslessSettings'
import { getBackendHost } from '@/config/constants/backend'
import Dialogs from '@/utils/Dialogs'
import ban from './ban'
import BackendUtils from '@/utils/BackendUtils'
import { GaslessSwapRequest } from '@/models/GaslessSwapRequest'
import SwapDialogs from '@/utils/SwapDialogs'
import { WBANTokenWithPermit } from '@artifacts/typechain'
import { MulticallWrapper } from 'kasumah-multicall'

@Module({
	namespaced: true,
	name: 'backend',
	store,
	dynamic: true,
})
class BackendModule extends VuexModule {
	private _online = false
	private _gaslessSettings: GaslessSettings = {
		enabled: false,
		swapAllowed: true,
		banThreshold: 0,
		cryptoThreshold: 0,
		swapContract: '',
	}
	private _banWalletForDeposits = ''
	private _banWalletForDepositsQRCode = ''
	private _banDeposited: BigNumber = BigNumber.from(0)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _deposits: Array<any> = []
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _withdrawals: Array<any> = []
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _swaps: Array<any> = []
	private _setupDone: boolean | undefined = undefined
	private _inError = false
	private _errorMessage = ''
	private _errorLink = ''
	private _streamEventsSource: EventSource | null = null
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-unused-vars
	private _web3listener: ((ev: Event) => any) | undefined = undefined

	get online() {
		return this._online
	}

	get gaslessSettings() {
		return this._gaslessSettings
	}

	get banWalletForDeposits() {
		return this._banWalletForDeposits
	}

	get banWalletForDepositsLink() {
		return `ban:${this._banWalletForDeposits}`
	}

	get banWalletForDepositsQRCode() {
		return this._banWalletForDepositsQRCode
	}

	get banDeposited() {
		return this._banDeposited
	}

	get deposits() {
		return this._deposits
	}

	get withdrawals() {
		return this._withdrawals
	}

	get swaps() {
		return this._swaps
	}

	get setupDone() {
		return this._setupDone
	}

	get inError() {
		return this._inError
	}

	get errorMessage() {
		return this._errorMessage
	}

	get errorLink() {
		return this._errorLink
	}

	@Mutation
	setOnline(online: boolean) {
		this._online = online
	}

	@Mutation
	setGaslessSettings(settings: GaslessSettings) {
		this._gaslessSettings = settings
	}

	@Mutation
	setBanWalletForDeposits(address: string) {
		this._banWalletForDeposits = address
	}

	@Mutation
	setBanWalletForDepositsQRCode(qrCode: string) {
		this._banWalletForDepositsQRCode = qrCode
	}

	@Mutation
	setBanDeposited(balance: BigNumber) {
		this._banDeposited = balance
	}

	@Mutation
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setDeposits(deposits: Array<any>) {
		this._deposits = deposits
	}

	@Mutation
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setWithdrawals(withdrawals: Array<any>) {
		this._withdrawals = withdrawals
	}

	@Mutation
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setSwaps(swaps: Array<any>) {
		this._swaps = swaps
	}

	@Mutation
	setSetupDone(setupDone: boolean) {
		this._setupDone = setupDone
	}

	@Mutation
	setInError(inError: boolean) {
		this._inError = inError
	}

	@Mutation
	setErrorMessage(errorMessage: string) {
		this._errorMessage = errorMessage
	}

	@Mutation
	setErrorLink(errorLink: string) {
		this._errorLink = errorLink
	}

	@Mutation
	setStreamEventsSource(eventSource: EventSource) {
		this._streamEventsSource = eventSource
	}

	@Mutation
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-unused-vars
	setWeb3Listener(listener: (ev: Event) => any) {
		this._web3listener = listener
	}

	@Action
	async initBackend(banWallet: string) {
		console.log(`in initBackend`)
		try {
			const healthResponse = await axios.request({ url: `${getBackendHost()}/health` })
			const healthStatus = healthResponse.data.status
			this.context.commit('setOnline', healthStatus === 'OK')

			const depositWalletResponse = await axios.request({ url: `${getBackendHost()}/deposits/ban/wallet` })
			const depositWalletAddress = depositWalletResponse.data.address
			this.context.commit('setBanWalletForDeposits', depositWalletAddress)
			this.context.commit(
				'setBanWalletForDepositsQRCode',
				await BackendUtils.getDepositsWalletQRCode(depositWalletAddress),
			)

			if (banWallet) {
				await this.loadGaslessSettings(banWallet)
			}

			if (!this._streamEventsSource && banWallet) {
				console.debug(`Initiating connection to streams endpoint for ${banWallet}`)
				/* eslint-disable @typescript-eslint/no-explicit-any */
				const eventSource: EventSource = new EventSource(`${getBackendHost()}/events/${banWallet}`)
				const withdrawalEvent = (e: any) => {
					console.debug(e)
					const { banWallet, withdrawal, balance, transaction } = JSON.parse(e.data)
					if (transaction) {
						console.log(
							`Received banano withdrawal event. Wallet "${banWallet}" withdrew ${withdrawal} BAN. Balance is: ${balance} BAN.`,
						)
						this.context.commit('setBanDeposited', ethers.utils.parseEther(balance))
						if (Contracts.wbanContract && Accounts.activeAccount) {
							Contracts.reloadWBANBalance({
								contract: Contracts.wbanContract,
								account: Accounts.activeAccount,
							})
						}
						Dialogs.showWithdrawalSuccess(withdrawal, transaction)
						BackendModule.trackEventInPlausible('Withdrawal: Pending')
					} else {
						console.log(
							`Received banano pending withdrawal event. Wallet "${banWallet}" withdrew ${withdrawal} BAN but this is put in a pending list`,
						)
						Dialogs.showPendingWithdrawal(withdrawal)
					}
				}

				const depositWalletResponse = await axios.request({ url: `${getBackendHost()}/deposits/ban/wallet` })
				const depositWalletAddress = depositWalletResponse.data.address
				this.context.commit('setBanWalletForDeposits', depositWalletAddress)
				this.context.commit(
					'setBanWalletForDepositsQRCode',
					await BackendUtils.getDepositsWalletQRCode(depositWalletAddress),
				)

				const bcAddress = Accounts.activeAccount
				if (bcAddress) {
					const setupDone = await BackendUtils.checkIfSetupDone(banWallet, bcAddress)
					this.context.commit('setSetupDone', setupDone)
					if (setupDone === false) {
						if (router.currentRoute.path !== '/setup') {
							router.push('/setup')
						}
						return
					}
					if (setupDone !== true) {
						console.error('Unexpected error when checking if claim was already done')
						this.context.commit('setSetupDone', false)
						this.context.commit('setInError', true)
						this.context.commit('setErrorMessage', setupDone)
						if (router.currentRoute.path !== '/setup') {
							router.push('/setup')
						}
					}
				}

				eventSource.addEventListener('banano-deposit', (e: any) => {
					console.debug(e.data)
					const { banWallet, deposit, balance, rejected } = JSON.parse(e.data)
					if (rejected) {
						console.log(`Received ${deposit} BAN which were sent back.`)
						Dialogs.declineUserDeposit(deposit)
						BackendModule.trackEventInPlausible('Deposit: Rejected')
					} else {
						console.log(
							`Received banano deposit event. Wallet "${banWallet}" deposited ${deposit} BAN. Balance is: ${balance} BAN.`,
						)
						this.context.commit('setBanDeposited', ethers.utils.parseEther(balance))
						Dialogs.confirmUserDeposit(deposit)
						BackendModule.trackEventInPlausible('Deposit')
					}
				})
				eventSource.addEventListener('banano-withdrawal', withdrawalEvent)
				eventSource.addEventListener('pending-withdrawal', withdrawalEvent)
				eventSource.addEventListener('swap-ban-to-wban', async (e: any) => {
					const { banWallet, blockchainWallet, swapped, receipt, uuid, gasless, balance, wbanBalance, txnHash } =
						JSON.parse(e.data)
					console.info(`Received swap BAN to wBAN event. Wallet "${banWallet}" swapped ${swapped} BAN to WBAN.`)
					console.debug(`Receipt is "${receipt}".`)
					console.debug('Gasless wrap?', gasless)
					console.debug(`Balance is: ${balance} BAN, ${wbanBalance} wBAN.`)
					if (Contracts.wbanContract && Accounts.activeAccount) {
						try {
							if (gasless) {
								const blockchainExplorerUrl = Accounts.network.blockExplorerUrls[0]
								const txnLink = `${blockchainExplorerUrl}/tx/${txnHash}`
								Dialogs.confirmSwapToWBan(swapped, txnHash, txnLink)
								BackendModule.trackEventInPlausible('Wrap: Gasless')
							} else {
								const signature: Signature = ethers.utils.splitSignature(receipt)
								console.debug(`Signature is ${JSON.stringify(signature)}`)
								const txnHash = await Contracts.mint({
									amount: ethers.utils.parseEther(swapped.toString()),
									blockchainWallet,
									receipt,
									uuid,
									contract: Contracts.wbanContract,
								})
								const blockchainExplorerUrl = Accounts.network.blockExplorerUrls[0]
								const txnLink = `${blockchainExplorerUrl}/tx/${txnHash}`
								Dialogs.confirmSwapToWBan(swapped, txnHash, txnLink)
								BackendModule.trackEventInPlausible('Wrap')
							}
							this.context.commit('setBanDeposited', ethers.utils.parseEther(balance))
							Contracts.reloadWBANBalance({
								account: blockchainWallet,
								contract: Contracts.wbanContract,
							})
							this.loadGaslessSettings(banWallet)
						} catch (err) {
							console.error(err)
							Dialogs.errorSwapToWBan(swapped)
							BackendModule.trackEventInPlausible('Wrap: Error')
						}
					} else {
						console.error("Can't make the call to the smart-contract to mint")
					}
				})
				eventSource.addEventListener('swap-wban-to-ban', async (e: any) => {
					const { banWallet, swapped, balance, wbanBalance } = JSON.parse(e.data)
					console.log(
						`Received swap wBAN to BAN event. Wallet "${banWallet}" swapped ${swapped} wBAN to BAN. Balance is: ${balance} BAN, ${wbanBalance} wBAN.`,
					)
					this.context.commit('setBanDeposited', ethers.utils.parseEther(balance))
					Contracts.updateWBanBalance(ethers.utils.parseEther(wbanBalance))
					Dialogs.confirmSwapToBan(swapped)
					BackendModule.trackEventInPlausible('Unwrap')
				})
				eventSource.addEventListener('gasless-swap', async (e: any) => {
					const { txnId, txnHash, txnLink } = JSON.parse(e.data)
					console.log(`Received gasless swap for txnId ${txnId}`)
					this.loadGaslessSettings(banWallet)
					SwapDialogs.confirmSwap(txnHash, txnLink)
					BackendModule.trackEventInPlausible('Swaps: Gasless')
				})
				eventSource.addEventListener('ping', () => console.debug('Ping received from the server'))
				eventSource.addEventListener('message', (e: any) => {
					console.warn('Got unexpected message')
					console.log(e)
				})
				eventSource.addEventListener('open', (e: any) => {
					console.debug('Connected to stream endpoint', e)
				})
				eventSource.addEventListener('error', (e: any) => {
					console.error(`Streams error`, e)
					if (e.readyState == EventSource.CLOSED) {
						console.warn('Connection to stream endpoint was closed.')
					} else {
						console.error('Connection to stream endpoint with unexpected error state:', e.readyState)
					}
				})
				this.context.commit('setStreamEventsSource', eventSource)

				// on Web3 provider change, check if the bridge setup was done
				if (!this._web3listener) {
					const listener = async () => {
						// close current Server-Side Events connection
						await this.closeStreamConnection()
						// establish new Server-Side Events connection
						await this.initBackend(ban.banAddress)
					}
					this.context.commit('setWeb3Listener', listener)
					document.addEventListener('web3-connection', listener)
				}
			}
		} catch (err) {
			console.error(err)
			this.context.commit('setOnline', false)
			this.context.commit(
				'setErrorMessage',
				'wBAN bridge is under maintenance. You can still use the farms while we work on this.',
			)
		}
	}

	@Action
	async loadGaslessSettings(banWallet: string) {
		try {
			const gaslessSettingsResponse = await axios.request({ url: `${getBackendHost()}/gasless/settings` })
			const swapAllowedResponse = await axios.request({ url: `${getBackendHost()}/gasless/settings/${banWallet}` })
			const gaslessSettings: GaslessSettings = {
				enabled: gaslessSettingsResponse.data.enabled,
				swapAllowed: swapAllowedResponse.data.gaslessSwapAllowed,
				banThreshold: gaslessSettingsResponse.data.banThreshold,
				cryptoThreshold: gaslessSettingsResponse.data.cryptoThreshold,
				swapContract: gaslessSettingsResponse.data.swapContract,
			}
			this.context.commit('setGaslessSettings', gaslessSettings)
		} catch (err) {
			console.error("Couldn't load gasless settings")
			this.context.commit('setGaslessSettings', {
				enabled: false,
				swapAllowed: false,
				banThreshold: 420,
				cryptoThreshold: 42,
			})
		}
	}

	@Action
	async closeStreamConnection() {
		if (this._streamEventsSource) {
			this._streamEventsSource.close()
			this.context.commit('setStreamEventsSource', null)
			console.debug('Closed stream conneection')
		}
	}

	@Action
	async loadBanDeposited(account: string) {
		if (account) {
			console.debug('in loadBanDeposited')
			const resp = await axios.get(`${getBackendHost()}/deposits/ban/${account}`)
			const { balance } = resp.data
			this.context.commit('setBanDeposited', ethers.utils.parseEther(balance))
		} else {
			console.error("Can't load BAN deposited as address is empty")
		}
	}

	@Action
	async claimAddresses(claimRequest: ClaimRequest): Promise<ClaimResponse> {
		const { banAddress, blockchainAddress, provider } = claimRequest
		console.info(`About to claim ${banAddress} with ${blockchainAddress}`)
		if (provider && banAddress && blockchainAddress) {
			try {
				const sig = await provider
					.getSigner()
					.signMessage(`I hereby claim that the BAN address "${banAddress}" is mine`)
				// call the backend for the swap
				const resp = await axios.post(`${getBackendHost()}/claim`, {
					banAddress,
					blockchainAddress,
					sig,
				})
				this.context.commit('setInError', false)
				this.context.commit('setErrorMessage', '')
				switch (resp.status) {
					case 200:
						// this.context.commit('setSetupDone', true)
						return { signature: sig, result: ClaimResponseResult.Ok }
					case 202:
						this.context.commit('setSetupDone', true)
						return { signature: sig, result: ClaimResponseResult.AlreadyDone }
					case 403:
						this.context.commit('setSetupDone', false)
						return { signature: sig, result: ClaimResponseResult.Blacklisted }
					default:
						this.context.commit('setSetupDone', false)
						return { signature: sig, result: ClaimResponseResult.Error }
				}
			} catch (err: any) {
				console.log(err)
				if (err.response) {
					this.context.commit('setInError', true)
					const response: AxiosResponse = err.response
					switch (response.status) {
						case 403:
							this.context.commit(
								'setErrorMessage',
								`BAN address "${banAddress}" is blacklisted. Use another BAN address.`,
							)
							break
						case 409:
							this.context.commit('setErrorMessage', response.data.message)
							break
						default:
							this.context.commit('setErrorMessage', err)
							break
					}
				}
				return { signature: '', result: ClaimResponseResult.Error }
			}
		}
		return { signature: '', result: ClaimResponseResult.Error }
	}

	@Action
	async checkSetupDone(banAddress: string): Promise<string | boolean> {
		return BackendUtils.checkIfSetupDone(banAddress, Accounts.activeAccount ?? '')
	}

	@Action
	async swap(swapRequest: SwapRequest): Promise<SwapResponse> {
		const { amount, banAddress, blockchainAddress, provider } = swapRequest
		console.info(`Swap from BAN to wBAN requested for ${amount} BAN`)
		if (provider && amount && blockchainAddress) {
			const sig = await provider
				.getSigner()
				.signMessage(`Swap ${amount} BAN for wBAN with BAN I deposited from my wallet "${banAddress}"`)
			// call the backend for the swap
			try {
				await axios.post(`${getBackendHost()}/swap`, {
					ban: banAddress,
					blockchain: blockchainAddress,
					amount: amount,
					sig: sig,
				})
				Dialogs.startSwapToWBan(amount.toString())
			} catch (err: any) {
				this.context.commit('setInError', true)
				if (err.response) {
					const response: AxiosResponse = err.response
					const error = response.data
					switch (response.status) {
						case 409:
							this.context.commit('setErrorMessage', error.error)
							this.context.commit('setErrorLink', error.link)
							break
						default:
							this.context.commit('setErrorMessage', err)
							this.context.commit('setErrorLink', '')
							break
					}
				} else {
					this.context.commit('setErrorMessage', err)
					this.context.commit('setErrorLink', '')
				}
				throw err
			}
		}
		return {
			message: '',
			transaction: '',
			link: '',
		}
	}

	@Action
	async withdrawBAN(withdrawRequest: WithdrawRequest): Promise<WithdrawResponse> {
		const { amount, banAddress, blockchainAddress, provider } = withdrawRequest
		console.info(`Should withdraw ${amount} BAN to ${banAddress}...`)
		if (provider && amount && blockchainAddress) {
			if (amount <= 0) {
				throw new Error('Invalid withdrawal amount')
			}
			const sig = await provider.getSigner().signMessage(`Withdraw ${amount} BAN to my wallet "${banAddress}"`)
			Dialogs.startWithdrawal()
			// call the backend for the swap
			try {
				const resp = await axios.post(`${getBackendHost()}/withdrawals/ban`, {
					ban: banAddress,
					blockchain: blockchainAddress,
					amount: amount,
					sig: sig,
				})
				const result: any = resp.data
				/*
				this.context.commit('setInError', false)
				this.context.commit('setErrorMessage', '')
				this.context.commit('setErrorLink', '')
				*/
				return result
			} catch (err: any) {
				this.context.commit('setInError', true)
				if (err.response) {
					const response: AxiosResponse = err.response
					const error = response.data
					switch (response.status) {
						case 409:
							this.context.commit('setErrorMessage', error.error)
							this.context.commit('setErrorLink', error.link)
							break
						default:
							this.context.commit('setErrorMessage', err)
							this.context.commit('setErrorLink', '')
							break
					}
				} else {
					this.context.commit('setErrorMessage', err)
					this.context.commit('setErrorLink', '')
				}
				throw err
			}
		}
		return {
			message: '',
			transaction: '',
			link: '',
		}
	}

	@Action
	async gaslessSwap(swap: GaslessSwapRequest): Promise<string> {
		const permit = {
			amount: swap.permit.amount,
			spender: this.gaslessSettings.swapContract,
			deadline: swap.permit.deadline,
			provider: swap.provider,
		}
		const sig = await Contracts.signPermitAllowance({
			amount: ethers.utils.parseEther(swap.permit.amount),
			spender: permit.spender,
			deadline: BigNumber.from(swap.permit.deadline),
			provider: swap.provider,
		})
		// call the backend for the gasless swap
		const req = {
			recipient: swap.recipient,
			permit: {
				amount: swap.permit.amount,
				deadline: swap.permit.deadline,
				signature: sig,
			},
			gasLimit: swap.gasLimit,
			swapCallData: swap.swapCallData,
		}
		SwapDialogs.startSwap()
		await axios.post(`${getBackendHost()}/gasless/swap/${swap.banWallet}`, req)
		return ''
	}

	@Action
	async getHistory(request: HistoryRequest) {
		const { blockchainAddress, banAddress } = request
		if (banAddress && blockchainAddress) {
			console.info(`About to fetch history for ${blockchainAddress} and ${banAddress}`)
			try {
				const resp = await axios.get(`${getBackendHost()}/history/${blockchainAddress}/${banAddress}`)
				const { deposits, withdrawals } = resp.data

				if (Accounts.providerEthers && Contracts.wbanContract) {
					const wrapper = new MulticallWrapper(Accounts.providerEthers, Accounts.network.chainIdNumber)
					const wban = await wrapper.wrap<WBANTokenWithPermit>(Contracts.wbanContract)
					const swaps = await Promise.all(
						resp.data.swaps.map(async (swap: any) => {
							if (swap.receipt && swap.uuid) {
								swap.consumed = await wban.isReceiptConsumed(blockchainAddress, BigNumber.from(swap.amount), swap.uuid)
							}
							if (swap.type === 'swap-to-ban') {
								swap.timestamp = swap.timestamp / 1_000
							}
							return swap
						}),
					)
					this.context.commit('setSwaps', swaps)
				}
				this.context.commit('setDeposits', deposits)
				this.context.commit('setWithdrawals', withdrawals)
			} catch (err: any) {
				console.log(err)
				this.context.commit('setInError', true)
				if (err.response) {
					const response: AxiosResponse = err.response
					switch (response.status) {
						case 409:
							this.context.commit('setErrorMessage', response.data.message)
							break
						default:
							this.context.commit('setErrorMessage', err)
							break
					}
				} else {
					this.context.commit('setErrorMessage', err)
				}
			}
		}
	}

	private static trackEventInPlausible(name: string) {
		plausible.trackEvent(name, {
			props: {
				network: Accounts.network.chainName,
			},
		})
	}
}

export default getModule(BackendModule)
export const Backend: BindingHelpers = namespace('backend')
