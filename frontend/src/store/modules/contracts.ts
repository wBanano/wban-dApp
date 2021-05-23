import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import store from '@/store'
// eslint-disable-next-line @typescript-eslint/camelcase
import { WBANToken, WBANToken__factory } from '@artifacts/typechain'
import { ethers, BigNumber, Signature } from 'ethers'
import SwapToBanRequest from '@/models/SwapToBanRequest'
import LoadBalancesFromContractRequest from '@/models/LoadBalancesFromContractRequest'
import Dialogs from '@/utils/Dialogs'
import SwapToWBanRequest from '@/models/SwapToWBanRequest'
import tokens from '@/config/constants/tokens'
import { Address } from '@/config/constants/types'

@Module({
	namespaced: true,
	name: 'contracts',
	store,
	dynamic: true
})
class ContractsModule extends VuexModule {
	private _wBanToken: WBANToken | null = null
	private _owner = ''
	private _totalSupply: BigNumber = BigNumber.from(0)
	private _wBanBalance: BigNumber = BigNumber.from(0)

	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	get wbanContract() {
		return this._wBanToken
	}

	get wbanAddress() {
		return this._wBanToken ? this._wBanToken.address : ''
	}

	get owner() {
		return this._owner
	}

	get totalSupply() {
		return this._totalSupply
	}

	get wBanBalance() {
		return this._wBanBalance
	}

	@Mutation
	setWBANToken(contract: WBANToken) {
		this._wBanToken = contract
	}

	@Mutation
	setOwner(owner: string) {
		this._owner = owner
	}

	@Mutation
	setTotalSupply(supply: BigNumber) {
		this._totalSupply = supply
	}

	@Mutation
	setWBANBalance(balance: BigNumber) {
		this._wBanBalance = balance
	}

	@Action
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async initContract(provider: any) {
		console.debug('in initContract')
		if (provider) {
			// do not initialize contract if this was done earlier
			if (!this._wBanToken) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				const contract = WBANToken__factory.connect(
					tokens.wban.address[ContractsModule.ENV_NAME as keyof Address],
					provider.getSigner()
				)
				this.context.commit('setWBANToken', contract)

				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const totalSupplyUpdateFn = async (_from: string, _to: string, _amount: BigNumber, _event: ethers.Event) => {
					const totalSupply: BigNumber = await contract.totalSupply()
					console.log(`Total Supply: ${ethers.utils.formatEther(totalSupply)} wBAN`)
					this.setTotalSupply(totalSupply)
				}
				// update total supply on mints
				contract.on(
					contract.filters.Transfer('0x0000000000000000000000000000000000000000', null, null),
					totalSupplyUpdateFn
				)
				// update total supply on burns
				contract.on(
					contract.filters.Transfer(null, '0x0000000000000000000000000000000000000000', null),
					totalSupplyUpdateFn
				)
			}
			// at this point the contract should be initialized
			if (!this._wBanToken) {
				console.error('Smart-contract client not initialized')
				return
			}
			const contract = this._wBanToken
			const owner = await contract.owner()
			console.log(`Owner is: ${owner}`)
			const totalSupply: BigNumber = await contract.totalSupply()
			this.setOwner(owner)
			this.setTotalSupply(totalSupply)
		}
	}

	@Action
	async loadBalances(request: LoadBalancesFromContractRequest) {
		const { contract, account } = request
		console.debug(`in loadBalances for account: ${account}`)
		const balance = await contract.balanceOf(account)
		console.info(`Balance is ${balance} wBAN`)
		this.context.commit('setWBANBalance', balance)
	}

	@Action
	updateWBanBalance(balance: BigNumber) {
		this.context.commit('setWBANBalance', balance)
	}

	@Action
	async reloadWBANBalance(request: LoadBalancesFromContractRequest) {
		const { contract, account } = request
		if (!contract || !account) {
			throw new Error(`Bad request ${JSON.stringify(request)}`)
		}
		const wbanBalance = await contract.balanceOf(account)
		console.info(`Balance ${ethers.utils.formatEther(wbanBalance)} wBAN`)
		this.context.commit('setWBANBalance', wbanBalance)
	}

	@Action
	async mint(swapRequest: SwapToWBanRequest): Promise<string> {
		console.log('Should mint wBAN')
		const { amount, bscWallet, receipt, uuid, contract } = swapRequest
		const signature: Signature = ethers.utils.splitSignature(receipt)
		const txn = await contract.mintWithReceipt(bscWallet, amount, uuid, signature.v, signature.r, signature.s)
		await txn.wait()
		return txn.hash
	}

	@Action
	async claim(swapRequest: SwapToWBanRequest): Promise<string> {
		console.log('Should claim wBAN')
		const { amount, bscWallet, receipt, uuid, contract } = swapRequest
		console.debug(`Amount: ${amount}, bscWallet: ${bscWallet}, receipt: ${receipt}, uuid: ${uuid}`)
		const signature: Signature = ethers.utils.splitSignature(receipt)
		const txn = await contract.mintWithReceipt(bscWallet, amount, uuid, signature.v, signature.r, signature.s)
		await txn.wait()
		return txn.hash
	}

	@Action
	async swap(swapRequest: SwapToBanRequest) {
		const { amount, toBanAddress, contract } = swapRequest
		console.log(`Should swap ${ethers.utils.formatEther(amount)} wBAN to BAN for "${toBanAddress}"`)
		const txn = await contract.swapToBan(toBanAddress, amount)
		Dialogs.startSwapToBan(ethers.utils.formatEther(amount))
		await txn.wait()
	}
}

export default getModule(ContractsModule)
export const Contracts: BindingHelpers = namespace('contracts')
