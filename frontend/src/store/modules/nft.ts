import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import store from '@/store'
import { WBANLPRewards, WBANLPRewards__factory } from 'wban-nfts'
import { NftData } from '@/models/nft/NftData'
import { LoadBalanceRequest } from '@/models/nft/LoadBalanceRequest'
import { ClaimGoldenRequest } from '@/models/nft/ClaimGoldenRequest'
import { ClaimAirdroppedNftRequest } from '@/models/nft/ClaimableNft'
import { ethers, Signature } from 'ethers'
import { fetchJson } from 'ethers/lib/utils'
import NftDialogs from '@/utils/NftDialogs'

@Module({
	namespaced: true,
	name: 'nft',
	store,
	dynamic: true,
})
class NftModule extends VuexModule {
	private _rewards: WBANLPRewards | null = null
	private _uri = ''
	private _nfts: Map<string, NftData> = new Map()

	static NFT_IDS = [900, 901, 0, 1, 2, 10, 11, 12, 20, 21, 22, 100, 101, 102]
	static NFT_REWARDS_CONTRACT: string = process.env.VUE_APP_NFT_REWARDS_CONTRACT || ''
	static NFT_OPENSEA_URL: string = process.env.VUE_APP_NFT_OPENSEA_URL || ''

	get rewardsContract() {
		return this._rewards
	}

	get uri() {
		return this._uri
	}

	get nfts() {
		return this._nfts
	}

	@Mutation
	setRewardsContract(contract: WBANLPRewards) {
		this._rewards = contract
	}

	@Mutation
	setUri(uri: string) {
		this._uri = uri
	}

	@Mutation
	setNfts(nfts: Map<string, NftData>) {
		this._nfts = nfts
	}

	@Action
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async initContract(provider: any) {
		console.debug('in initContract')
		if (provider) {
			// do not initialize contract if this was done earlier
			if (!this._rewards) {
				const contract = WBANLPRewards__factory.connect(NftModule.NFT_REWARDS_CONTRACT, provider.getSigner())
				this.context.commit('setRewardsContract', contract)
			} else {
				console.warn('Already initialized')
			}
			// at this point the contract should be initialized
			if (!this._rewards) {
				console.error('Smart-contract client not initialized')
				return
			}
			// fetch metadata URI for images
			this.context.commit('setUri', await this._rewards.uri(0))
		} else {
			console.error('Missing Web3 provider')
		}
	}

	@Action
	async loadNFTs(request: LoadBalanceRequest) {
		const { contract, account } = request
		console.debug(`in loadNFTs for ${account}`)
		// load NFT balances
		const balances = await contract.balanceOfBatch(
			[
				account,
				account,
				account,
				account,
				account,
				account,
				account,
				account,
				account,
				account,
				account,
				account,
				account,
				account,
			],
			NftModule.NFT_IDS
		)
		console.debug(`Balances of ${account} are ${balances}`)
		// load NFT data
		const uriTemplate = this._uri.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/')
		const nfts: Map<string, NftData> = new Map()
		for (let index = 0; index < NftModule.NFT_IDS.length; index++) {
			const balance: number = balances[index].toNumber()
			const nftId = NftModule.NFT_IDS[index].toString()
			const metadataUri = uriTemplate.replace(
				'{id}',
				ethers.utils.hexZeroPad(`0x${NftModule.NFT_IDS[index].toString(16)}`, 32).substring(2)
			)
			//console.debug(`Metadata URI is: ${metadataUri}`)
			const metadata = await fetchJson(metadataUri)
			//console.debug(metadata)
			const name = metadata.name
			const description = metadata.description
			const cid = metadata.image.substring('ipfs://'.length)
			const uri = `https://cloudflare-ipfs.com/ipfs/${cid}`
			nfts.set(nftId.toString(), {
				id: nftId,
				name,
				description,
				image: uri,
				balance,
			})
		}
		this.context.commit('setNfts', nfts)
	}

	@Action
	async claimGoldenNFT(request: ClaimGoldenRequest) {
		const { contract, account, level } = request
		const txn = await contract.claimGoldenNFT(level)
		await txn.wait()
		await this.loadNFTs({
			contract,
			account,
		})
	}

	@Action
	async claimAirdroppedNFTs(request: ClaimAirdroppedNftRequest) {
		const { contract, claimableNfts } = request
		return new Promise((resolve, reject) => {
			// open dialog asking yes/no for claims + numbers
			NftDialogs.startNftClaims(claimableNfts.length).onOk(async () => {
				for (let i = 0; i < claimableNfts.length; i++) {
					console.info(`Claiming NFT ${i + 1} of ${claimableNfts.length}`)
					const claim = claimableNfts[i]
					// update dialog -- loop over each NFT to claim
					NftDialogs.claimNft(i + 1, claimableNfts.length)
					// claim NFT
					try {
						console.debug(`Claiming NFT ${claim.nft} with ${claim.quantity} quantity`)
						const signature: Signature = ethers.utils.splitSignature(claim.receipt)
						const txn = await contract.claimFromReceipt(
							claim.address,
							claim.nft,
							claim.quantity,
							'0x00',
							claim.uuid,
							signature.v,
							signature.r,
							signature.s
						)
						await txn.wait()
					} catch (err) {
						console.error('Claiming NFT aborted', err)
						reject(undefined)
					}
				}
				// close dialog
				NftDialogs.endClaimNft()
				resolve(undefined)
			})
		})
	}
}

export default getModule(NftModule)
export const Contracts: BindingHelpers = namespace('nft')
