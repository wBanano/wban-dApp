import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { Notify, openURL } from 'quasar'
import store from '@/store'
import Contracts from '@/store/modules/contracts'
import Accounts from '@/store/modules/accounts'
import axios, { AxiosResponse } from 'axios'
import { BigNumber, ethers } from 'ethers'
import ClaimRequest from '@/models/ClaimRequest'
import SwapRequest from '@/models/SwapRequest'
import SwapResponse from '@/models/SwapResponse'
import WithdrawRequest from '@/models/WithdrawRequest'
import WithdrawResponse from '@/models/WithdrawResponse'
import { ClaimResponse } from '@/models/ClaimResponse'

@Module({
	namespaced: true,
	name: 'backend',
	store,
	dynamic: true
})
class BackendModule extends VuexModule {
	private _online = false
	private _banWalletForDeposits = ''
	private _banDeposited: BigNumber = BigNumber.from(0)
	private _inError = false
	private _errorMessage = ''
	private _errorLink = ''
	private _streamEventsSource: EventSource | null = null
	static BACKEND_URL: string = process.env.VUE_APP_BACKEND_URL || ''

	get online() {
		return this._online
	}

	get banWalletForDeposits() {
		return this._banWalletForDeposits
	}

	get banWalletForDepositsLink() {
		return `ban:${this._banWalletForDeposits}`
	}

	get banDeposited() {
		return this._banDeposited
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
	setBanWalletForDeposits(address: string) {
		this._banWalletForDeposits = address
	}

	@Mutation
	setBanDeposited(balance: BigNumber) {
		this._banDeposited = balance
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

	@Action
	async initBackend(banWallet: string) {
		console.log(`in initBackend`)
		try {
			const healthResponse = await axios.request({ url: `${BackendModule.BACKEND_URL}/health` })
			const healthStatus = healthResponse.data.status
			this.context.commit('setOnline', healthStatus === 'OK')

			if (!this._streamEventsSource && banWallet) {
				console.debug(`Initiating connection to streams endpoint for ${banWallet}`)
				/* eslint-disable @typescript-eslint/no-explicit-any */
				const eventSource: EventSource = new EventSource(`${BackendModule.BACKEND_URL}/events/${banWallet}`)
				const withdrawalEvent = (e: any) => {
					console.debug(e)
					const { banWallet, withdrawal, balance, transaction } = JSON.parse(e.data)
					console.log(
						`Received banano withdrawal event. Wallet "${banWallet}" withdrew ${withdrawal} BAN. Balance is: ${balance} BAN.`
					)
					this.context.commit('setBanDeposited', ethers.utils.parseEther(balance))
					if (Contracts.wbanContract && Accounts.activeAccount) {
						Contracts.reloadWBANBalance({
							contract: Contracts.wbanContract,
							account: Accounts.activeAccount
						})
					}
					// notify user
					Notify.create({
						type: 'positive',
						html: true,
						message: `View transaction on <a href="https://creeper.banano.cc/explorer/block/${transaction}">Banano Explorer</a>`,
						caption: `Transaction ${transaction}`,
						actions: [
							{
								label: 'View',
								color: 'white',
								handler: () => {
									openURL(`https://creeper.banano.cc/explorer/block/${transaction}`)
								}
							}
						]
					})
				}

				eventSource.addEventListener('banano-deposit', (e: any) => {
					const { banWallet, deposit, balance } = JSON.parse(e.data)
					console.log(
						`Received banano deposit event. Wallet "${banWallet}" deposited ${deposit} BAN. Balance is: ${balance} BAN.`
					)
					this.context.commit('setBanDeposited', ethers.utils.parseEther(balance))
				})
				eventSource.addEventListener('banano-withdrawal', withdrawalEvent)
				eventSource.addEventListener('pending-withdrawal', withdrawalEvent)
				eventSource.addEventListener('swap-ban-to-wban', (e: any) => {
					const { banWallet, swapped, balance, wbanBalance, transaction, transactionLink } = JSON.parse(e.data)
					console.log(
						`Received swap BAN to wBAN event. Wallet "${banWallet}" swapped ${swapped} BAN to WBAN. Balance is: ${balance} BAN, ${wbanBalance} wBAN.`
					)
					this.context.commit('setBanDeposited', ethers.utils.parseEther(balance))
					Contracts.updateWBanBalance(ethers.utils.parseEther(wbanBalance))
					if (Contracts.wbanContract && Accounts.activeAccount) {
						Contracts.reloadBNBDeposits({
							contract: Contracts.wbanContract,
							account: Accounts.activeAccount
						})
					}
					Notify.create({
						type: 'positive',
						html: true,
						message: `View transaction on <a href="${transactionLink}">BscScan</a>`,
						caption: `Transaction ${transaction}`,
						actions: [
							{
								label: 'View',
								color: 'white',
								handler: () => {
									openURL(transactionLink)
								}
							}
						]
					})
				})
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
						console.log('Connection to stream endpoint was closed.')
					}
				})
				this.context.commit('setStreamEventsSource', eventSource)
			}

			const depositWalletResponse = await axios.request({ url: `${BackendModule.BACKEND_URL}/deposits/ban/wallet` })
			const depositWalletAddress = depositWalletResponse.data.address
			this.context.commit('setBanWalletForDeposits', depositWalletAddress)
		} catch (err) {
			console.error(err)
			this.context.commit('setOnline', false)
			this.context.commit('setErrorMessage', 'API is not reacheable. Please try again later.')
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
			const resp = await axios.get(`${BackendModule.BACKEND_URL}/deposits/ban/${account}`)
			const { balance } = resp.data
			this.context.commit('setBanDeposited', ethers.utils.parseEther(balance))
		} else {
			console.error("Can't load BAN deposited as address is empty")
		}
	}

	@Action
	async claimAddresses(claimRequest: ClaimRequest): Promise<ClaimResponse> {
		const { banAddress, bscAddress, provider } = claimRequest
		console.info(`About to claim ${banAddress} with ${bscAddress}`)
		if (provider && banAddress && bscAddress) {
			const sig = await provider.getSigner().signMessage(`I hereby claim that the BAN address "${banAddress}" is mine`)
			// call the backend for the swap
			try {
				const resp = await axios.post(`${BackendModule.BACKEND_URL}/claim`, {
					banAddress: banAddress,
					bscAddress: bscAddress,
					sig: sig
				})
				this.context.commit('setInError', false)
				this.context.commit('setErrorMessage', '')
				switch (resp.status) {
					case 200:
						return ClaimResponse.Ok
					case 202:
						return ClaimResponse.AlreadyDone
					default:
						return ClaimResponse.Error
				}
			} catch (err) {
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
				return ClaimResponse.Error
			}
		}
		return ClaimResponse.Error
	}

	@Action
	async swap(swapRequest: SwapRequest): Promise<SwapResponse> {
		const { amount, banAddress, bscAddress, provider } = swapRequest
		console.info(`Swap from BAN to wBAN requested for ${amount} BAN`)
		if (provider && amount && bscAddress) {
			const sig = await provider
				.getSigner()
				.signMessage(`Swap ${amount} BAN for wBAN with BAN I deposited from my wallet "${banAddress}"`)
			// call the backend for the swap
			try {
				await axios.post(`${BackendModule.BACKEND_URL}/swap`, {
					ban: banAddress,
					bsc: bscAddress,
					amount: amount,
					sig: sig
				})
				/*
				const result: SwapResponse = resp.data
				this.context.commit('setInError', false)
				this.context.commit('setErrorMessage', '')
				this.context.commit('setErrorLink', '')
				return result
				*/
			} catch (err) {
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
			link: ''
		}
	}

	@Action
	async withdrawBAN(withdrawRequest: WithdrawRequest): Promise<WithdrawResponse> {
		const { amount, banAddress, bscAddress, provider } = withdrawRequest
		console.info(`Should withdraw ${amount} BAN to ${banAddress}...`)
		if (provider && amount && bscAddress) {
			const sig = await provider.getSigner().signMessage(`Withdraw ${amount} BAN to my wallet "${banAddress}"`)
			// call the backend for the swap
			try {
				const resp = await axios.post(`${BackendModule.BACKEND_URL}/withdrawals/ban`, {
					ban: banAddress,
					bsc: bscAddress,
					amount: amount,
					sig: sig
				})
				const result: SwapResponse = resp.data
				this.context.commit('setInError', false)
				this.context.commit('setErrorMessage', '')
				this.context.commit('setErrorLink', '')
				return result
			} catch (err) {
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
			link: ''
		}
	}
}

export default getModule(BackendModule)
