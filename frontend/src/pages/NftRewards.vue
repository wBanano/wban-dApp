<template>
	<q-page>
		<div class="q-pa-md">
			<div class="row items-center">
				<h6 class="subtitle justify-center offset-md-1">
					<q-btn to="/" icon="arrow_back" text-color="primary" flat style="margin-top: -10px" />
					Home
				</h6>
			</div>
			<div v-if="claimableNfts.length > 0" class="row justify-center q-pb-md">
				<q-banner inline-actions rounded class="bg-primary text-secondary">
					<span>You have been airdropped and you can claim some free NFTs.</span>
					<template v-slot:action>
						<q-btn flat label="Grab them" @click="claimAirdroppedNFTs()" />
					</template>
				</q-banner>
			</div>
			<div v-if="missingForGolden !== 0" class="row justify-center q-pb-md">
				<q-banner inline-actions rounded class="bg-primary text-secondary">
					<span>You are missing only a single NFT in order to claim a golden one.</span>
					<template v-slot:action>
						<q-btn flat label="Buy" @click="buy(missingForGolden)" />
					</template>
				</q-banner>
			</div>
			<div v-if="claimableForGolden !== -1" class="row justify-center q-pb-md">
				<q-banner inline-actions rounded class="bg-primary text-secondary">
					<span>You have enough NFTs in order to claim a golden NFT.</span>
					<template v-slot:action>
						<q-btn flat label="Claim" @click="promptForGoldenNFT = true" />
					</template>
				</q-banner>
			</div>
			<div class="nfts row q-col-gutter-md justify-center">
				<div class="col-4" v-for="[nftId, nftData] in nfts" :key="nftId">
					<nft-reward :nftId="nftId" :data="nftData" />
				</div>
			</div>
		</div>
		<q-dialog v-model="promptForGoldenNFT" persistent>
			<q-card class="claim-golden-nft-dialog">
				<q-card-section>
					<div class="text-h6">Claim Golden NFT</div>
				</q-card-section>
				<q-card-section>
					<div class="row">
						<p>
							You have the required NFTs in order to claim a
							<strong>Golden {{ nameForLevel(claimableForGolden) }}</strong> NFT.
						</p>
						<p>
							Doing so will <strong>burn/destroy</strong> your three {{ nameForLevel(claimableForGolden) }} NFTs and
							give you the Golden {{ nameForLevel(claimableForGolden) }} NFT instead.
						</p>
					</div>
					<div class="row justify-center items-center">
						<div class="col-3">
							<q-avatar square class="fit">
								<img :src="pictureOf(claimableForGolden)" />
								<q-badge floating outline transparent color="secondary">
									<q-icon name="whatshot" color="red" style="font-size: 15rem" />
								</q-badge>
							</q-avatar>
						</div>
						<div class="col-1 text-center">
							<q-icon name="add_circle_outline" color="positive" style="font-size: 2rem" />
						</div>
						<div class="col-3">
							<q-avatar square class="fit">
								<img :src="pictureOf(10 + claimableForGolden)" />
								<q-badge floating outline transparent color="secondary">
									<q-icon name="whatshot" color="red" style="font-size: 15rem" />
								</q-badge>
							</q-avatar>
						</div>
						<div class="col-1 text-center">
							<q-icon name="add_circle_outline" color="positive" style="font-size: 2rem" />
						</div>
						<div class="col-3">
							<q-avatar square class="fit">
								<img :src="pictureOf(20 + claimableForGolden)" />
								<q-badge floating outline transparent color="secondary">
									<q-icon name="whatshot" color="red" style="font-size: 15rem" />
								</q-badge>
							</q-avatar>
						</div>
					</div>
					<div class="row justify-center" style="padding-top: 20px">
						<div class="col-auto">
							<q-icon name="arrow_downward" color="positive" style="font-size: 2rem" />
						</div>
					</div>
					<div class="row justify-center">
						<div class="col-3">
							<q-avatar square class="fit">
								<img :src="pictureOf(100 + claimableForGolden)" />
							</q-avatar>
						</div>
					</div>
				</q-card-section>
				<q-card-actions align="right">
					<q-btn flat label="Cancel" color="primary" v-close-popup />
					<q-btn
						@click="claim(claimableForGolden)"
						color="primary"
						text-color="secondary"
						label="Claim"
						v-close-popup
					/>
				</q-card-actions>
			</q-card>
		</q-dialog>
	</q-page>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import NftReward from '@/components/nft/NftReward.vue'
import NftPicture from '@/components/nft/NftPicture.vue'
import { NftData } from '@/models/nft/NftData'
import { ClaimableNft } from '@/models/nft/ClaimableNft'
import nft from '@/store/modules/nft'
import { WBANLPRewards } from 'wban-nfts'
import { asyncFilter, sleep } from '@/utils/AsyncUtils'
import { ethers } from 'ethers'
import axios, { AxiosResponse } from 'axios'
import { openURL } from 'quasar'

const nftStore = namespace('nft')
const accountsStore = namespace('accounts')

@Component({
	components: {
		NftReward,
		NftPicture,
	},
})
export default class NftRewardsPage extends Vue {
	@nftStore.Getter('nfts')
	nfts!: Map<string, NftData>

	@nftStore.Getter('rewardsContract')
	rewardsContract!: WBANLPRewards

	@accountsStore.State('activeAccount')
	activeAccount!: string

	@accountsStore.Getter('providerEthers')
	provider!: ethers.providers.Web3Provider | null

	missingForGolden = 0
	claimableForGolden = -1
	promptForGoldenNFT = false

	claimableNfts: Array<ClaimableNft> = []

	static NFT_CLAIMABLE_ENDPOINT: string = process.env.VUE_APP_NFT_CLAIMABLE_ENDPOINT || ''

	buy(nftId: number) {
		openURL(`${NftReward.NFT_OPENSEA_URL}/${NftReward.NFT_REWARDS_CONTRACT}/${nftId}`)
	}

	nameForLevel(level: number): string {
		switch (level) {
			case 0:
				return 'Shrimp'
			case 1:
				return 'Shark'
			case 2:
				return 'Whale'
		}
		return '???'
	}

	pictureOf(nftId: number): string {
		console.debug(`Computing picture uri for ${nftId}`)
		const nftData = this.nfts.get(nftId.toString())
		// console.debug(nftData)
		if (nftData) {
			console.debug(`URI for ${nftId} is ${nftData.image}`)
			return nftData.image
		} else {
			console.warn(`Can't find picture for ${nftId}`)
			return ''
		}
	}

	/**
	 * Returns the first nftId missing to get a complete required serie for claiming a golden NFT
	 */
	computeFirstMissingNft(): number {
		const balances: Map<number, number> = new Map()
		this.nfts.forEach((nft: NftData, key: string) => {
			if (nft.balance > 0) {
				balances.set(Number.parseInt(key), nft.balance)
			}
		})
		const levels = [0, 1, 2]
		const missingNfts = levels
			.map((level) => {
				// missing wBAN staking NFT?
				if (!balances.has(0 + level) && balances.has(10 + level) && balances.has(20 + level)) {
					return 0 + level
				}
				// missing wBAN-BNB NFT?
				if (balances.has(0 + level) && !balances.has(10 + level) && balances.has(20 + level)) {
					return 10 + level
				}
				// missing wBAN-BUSD NFT?
				if (balances.has(0 + level) && balances.has(10 + level) && !balances.has(20 + level)) {
					return 20 + level
				}
			})
			.filter((level) => level !== undefined)
		if (missingNfts.length > 0 && missingNfts[0] !== undefined) {
			return missingNfts[0]
		} else {
			return 0
		}
	}

	/**
	 * Returns the level of a serie which can be used in order to claim a golden NFT.
	 * If none are eligible, returns -1.
	 */
	canClaimGoldenNft(): number {
		const balances: Map<number, number> = new Map()
		this.nfts.forEach((nft: NftData, key: string) => {
			if (nft.balance > 0) {
				balances.set(Number.parseInt(key), nft.balance)
			}
		})
		const levels = [0, 1, 2]
		const claimableLevels = levels.filter(
			(level) => balances.has(0 + level) && balances.has(10 + level) && balances.has(20 + level)
		)
		if (claimableLevels.length > 0 && claimableLevels[0] !== undefined) {
			return claimableLevels[0]
		} else {
			return -1
		}
	}

	async claim(level: number) {
		await nft.claimGoldenNFT({
			contract: this.rewardsContract,
			account: this.activeAccount,
			level: level,
		})
	}

	async claimAirdroppedNFTs() {
		await nft.claimAirdroppedNFTs({
			contract: this.rewardsContract,
			claimableNfts: this.claimableNfts,
		})
		console.debug(`Reloading balances`)
		await this.reload()
	}

	async reload() {
		await nft.loadNFTs({
			contract: this.rewardsContract,
			account: this.activeAccount,
		})
		// check if there is a single NFT missing in order to claim a golden one
		this.missingForGolden = this.computeFirstMissingNft()
		this.claimableForGolden = this.canClaimGoldenNft()
		const response: AxiosResponse<Array<ClaimableNft>> = await axios.request({
			url: `${NftRewardsPage.NFT_CLAIMABLE_ENDPOINT}?address=${this.activeAccount}`,
		})
		// filter consumed receipts
		this.claimableNfts = await asyncFilter(response.data, async (claim: ClaimableNft) => {
			const consumed = await this.rewardsContract.isReceiptConsumed(
				this.activeAccount,
				claim.nft,
				claim.quantity,
				'0x00',
				claim.uuid
			)
			console.debug(`${claim.nft} consumed? ${consumed}`)
			return !consumed
		})
		console.info(`${this.claimableNfts.length} different NFT claimable`)
	}

	async onProviderChange() {
		await nft.initContract(this.provider)
		await this.reload()
	}

	async mounted() {
		while (!this.provider) {
			await sleep(100)
		}
		this.onProviderChange()
		document.addEventListener('web3-connection', this.onProviderChange)
	}
}
</script>

<style lang="sass" scoped>
.nft-banner, .nfts
	max-width: 1000px
	margin-left: auto
	margin-right: auto

@media (min-width: 1000px)
	.claim-golden-nft-dialog
		min-width: 1000px

.vertical-center
	margin-top: auto
	margin-bottom: auto
</style>
