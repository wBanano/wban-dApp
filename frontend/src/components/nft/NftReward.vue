<template>
	<div class="col-xl-3 col-lg-3 col-md-4 col-sm-8 col-xs-12 flex">
		<q-card class="nft-card fit text-white">
			<q-item>
				<q-item-section>
					<q-item-label>
						<div class="text-bold">{{ data.name }}</div>
					</q-item-label>
				</q-item-section>
				<q-item-section side>
					<q-item-label class="text-right text-bold">Qty: {{ data.balance }}</q-item-label>
				</q-item-section>
			</q-item>
			<q-separator class="bg-secondary" />
			<q-card-section class="text-center">
				<nft-picture :uri="data.image" :disabled="data.balance === 0" />
			</q-card-section>
			<q-separator class="bg-secondary" />
			<q-card-actions class="nft-actions">
				<q-btn-group outline spread class="fit">
					<q-btn @click="buyOrSell()" color="primary" class="fit" flat>Buy/Sell</q-btn>
				</q-btn-group>
			</q-card-actions>
		</q-card>
	</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import NftPicture from '@/components/nft/NftPicture.vue'
import NftData from '@/models/nft/NftData'
import { openURL } from 'quasar'

const nftStore = namespace('nft')

@Component({
	components: {
		NftPicture
	}
})
export default class NftReward extends Vue {
	@Prop({ type: String, required: true }) nftId!: string
	@Prop({ type: Object, required: true }) data!: NftData

	@nftStore.Getter('uri')
	uriTemplate!: string

	name = ''
	description = ''
	uri = ''

	static NFT_REWARDS_CONTRACT: string = process.env.VUE_APP_NFT_REWARDS_CONTRACT || ''
	static NFT_OPENSEA_URL: string = process.env.VUE_APP_NFT_OPENSEA_URL || ''

	buyOrSell() {
		openURL(`${NftReward.NFT_OPENSEA_URL}/${NftReward.NFT_REWARDS_CONTRACT}/${this.nftId}`)
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.nft-card
	background-color: lighten($secondary, 10%) !important
	.nft-actions
		background-color: lighten($secondary, 10%) !important
</style>
