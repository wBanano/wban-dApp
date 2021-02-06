import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import store from '@/store'
import axios, { AxiosResponse } from 'axios'
import { BigNumber } from 'ethers'
import ClaimRequest from '@/models/ClaimRequest'
import SwapRequest from '@/models/SwapRequest'

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
	private apiUrl = 'https://wban-api.kalixia.com'
	// private apiUrl = 'http://localhost:3000'

	get online() {
		return this._online
	}

	get banWalletForDeposits() {
		return this._banWalletForDeposits
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

	@Action
	async initBackend() {
		console.log('in initBackend')
		try {
			const healthResponse = await axios.request({ url: `${this.apiUrl}/health` })
			const healthStatus = healthResponse.data.status
			this.context.commit('setOnline', healthStatus === 'OK')

			const depoositWalletResponse = await axios.request({ url: `${this.apiUrl}/deposits/ban/wallet` })
			const depositWalletAddress = depoositWalletResponse.data.address
			this.context.commit('setBanWalletForDeposits', depositWalletAddress)
		} catch (err) {
			console.error(err)
			this.context.commit('setOnline', false)
			this.context.commit('setErrorMessage', 'API is not reacheable. Please try again later.')
		}
	}

	@Action
	async loadBanDeposited(account: string) {
		if (account) {
			console.debug('in loadBanDeposited')

			const eventSource = new EventSource(`${this.apiUrl}/deposits/ban/${account}`)
			eventSource.addEventListener(
				'message',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(e: any) => {
					// commit the new value only if different from the actual one
					if (!this.banDeposited.eq(e.data)) {
						this.context.commit('setBanDeposited', BigNumber.from(e.data))
					}
				},
				false
			)

			eventSource.addEventListener(
				'open',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(e: any) => {
					// Connection was opened.
					console.debug('Connected to balances endpoint', e)
				},
				false
			)

			eventSource.addEventListener(
				'error',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(e: any) => {
					console.debug(e)
					if (e.readyState == EventSource.CLOSED) {
						console.log('Connection to balances endpoint was closed.')
					}
				},
				false
			)
		} else {
			console.error("Can't load BAN deposited as address is empty")
		}
	}

	@Action
	async claimAddresses(claimRequest: ClaimRequest): Promise<boolean> {
		const { banAddress, bscAddress, provider } = claimRequest
		console.info(`About to claim ${banAddress} with ${bscAddress}`)
		if (provider && banAddress && bscAddress) {
			const sig = await provider.getSigner().signMessage(`I hereby claim that the BAN address "${banAddress}" is mine`)
			// call the backend for the swap
			try {
				const r = await axios.post(`${this.apiUrl}/claim`, {
					banAddress: banAddress,
					bscAddress: bscAddress,
					sig: sig
				})
				console.debug(r)
				this.context.commit('setInError', false)
				this.context.commit('setErrorMessage', '')
				return true
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
				return false
			}
		}
		return false
	}

	@Action
	async swap(swapRequest: SwapRequest) {
		const { amount, banAddress, bscAddress, provider } = swapRequest
		console.info(`Should swap ${amount} BAN to wBAN...`)
		if (provider && amount && bscAddress) {
			const sig = await provider
				.getSigner()
				.signMessage(`Swap ${amount} BAN for wBAN with BAN I deposited from my wallet "${banAddress}"`)
			// call the backend for the swap
			try {
				await axios.post(`${this.apiUrl}/swap`, {
					ban: banAddress,
					bsc: bscAddress,
					amount: amount,
					sig: sig
				})
				this.context.commit('setInError', false)
				this.context.commit('setErrorMessage', '')
				this.context.commit('setErrorLink', '')
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
			}
		}
	}
}

export default getModule(BackendModule)