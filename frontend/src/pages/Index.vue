<template>
	<q-page>
		<div v-if="isUserConnected && banAddress" class="q-pa-md row items-start">
			<div class="col-lg-3 col-md-3 col-sm-3 gt-xs">
				<Statistics />
			</div>
			<div class="col-lg-7 col-md-7 col-sm-9 col-xs-12">
				<ChainInfo />
			</div>
		</div>
		<div v-if="!isUserConnected" class="welcome-section row justify-center">
			<div class="col-lg-8 col-md-11 col-sm-10 col-xs-12 text-center">
				<h3>{{ $t('pages.index.title') }}</h3>
				<h5>{{ $t('pages.index.available-on') }}</h5>
				<div class="row items-top justify-center">
					<div class="col-3 col-md-2 col-sm-3 col-xs-4">
						<q-card flat class="selectable cursor-pointer" @click="connectWalletProvider('bsc')">
							<img src="bsc-home-logo.svg" width="80px" height="80px" />
							<q-card-section>BSC</q-card-section>
						</q-card>
					</div>
					<div class="col-3 col-md-2 col-sm-3 col-xs-4">
						<q-card flat class="selectable cursor-pointer" @click="connectWalletProvider('polygon')">
							<img src="polygon-home-logo.svg" width="80px" height="80px" />
							<q-card-section>Polygon</q-card-section>
						</q-card>
					</div>
					<div class="col-3 col-md-2 col-sm-3 col-xs-4">
						<q-card flat class="selectable cursor-pointer" @click="connectWalletProvider('fantom')">
							<img src="fantom-home-logo.svg" width="80px" height="80px" />
							<q-card-section>Fantom</q-card-section>
						</q-card>
					</div>
					<div class="col-3 col-md-2 col-sm-3 col-xs-4">
						<q-card flat class="selectable cursor-pointer" @click="connectWalletProvider('ethereum')">
							<img src="ethereum-home-logo.svg" width="80px" height="80px" />
							<q-card-section>Ethereum</q-card-section>
						</q-card>
					</div>
				</div>
				<br /><br />
				<q-btn @click="connectWalletProvider" size="xl" color="primary" text-color="secondary" :label="$t('connect')" />
				<div v-if="!$q.platform.is.mobile">
					<h4>{{ $t('pages.index.what-can-you-do') }}</h4>
					<div class="use-cases row items-stretch q-col-gutter-md">
						<div class="col">
							<q-card>
								<q-card-section>
									<div class="text-h5">{{ $t('pages.index.swap-with-other-crypto') }}</div>
								</q-card-section>
								<q-card-section>
									<p>{{ $t('pages.index.swap-with-other-crypto-description') }}</p>
								</q-card-section>
							</q-card>
						</div>
						<div class="col">
							<q-card>
								<q-card-section>
									<div class="text-h5">{{ $t('pages.index.earn-some-wban') }}</div>
								</q-card-section>
								<q-card-section>
									<p>{{ $t('pages.index.earn-some-wban-description') }}</p>
								</q-card-section>
							</q-card>
						</div>
						<div class="col">
							<q-card>
								<q-card-section>
									<div class="text-h5">{{ $t('pages.index.learn-defi') }}</div>
								</q-card-section>
								<q-card-section>
									<p>{{ $t('pages.index.learn-defi-description') }}</p>
								</q-card-section>
							</q-card>
						</div>
					</div>
				</div>
			</div>
		</div>
	</q-page>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import router from '@/router'
import Statistics from '@/components/Statistics.vue'
import ChainInfo from '@/components/ChainInfo.vue'
import accounts from '@/store/modules/accounts'
import { BSC_MAINNET, ETHEREUM_MAINNET, FANTOM_MAINNET, Network, POLYGON_MAINNET } from '@/utils/Networks'

const banStore = namespace('ban')
const accountsStore = namespace('accounts')

@Component({
	components: {
		Statistics,
		ChainInfo,
	},
})
export default class PageIndex extends Vue {
	@accountsStore.State('network')
	currentBlockchain!: Network

	@accountsStore.Getter('isUserConnected')
	isUserConnected!: boolean

	@banStore.Getter('banAddress')
	banAddress!: string

	@Watch('isUserConnected')
	redirect() {
		console.log('in redirect')
		if (this.isUserConnected && (!this.banAddress || this.banAddress === '')) {
			if (router.currentRoute.path !== '/setup') {
				router.push('/setup')
			}
		} else {
			console.debug(`BAN address: ${this.banAddress}`)
		}
	}

	async connectWalletProvider(wanted: 'bsc' | 'polygon' | 'fantom' | 'ethereum' | undefined) {
		let wantedChain = undefined
		if (wanted === 'bsc') {
			wantedChain = BSC_MAINNET.chainId
		} else if (wanted === 'polygon') {
			wantedChain = POLYGON_MAINNET.chainId
		} else if (wanted === 'fantom') {
			wantedChain = FANTOM_MAINNET.chainId
		} else if (wanted === 'ethereum') {
			wantedChain = ETHEREUM_MAINNET.chainId
		}
		console.warn('Wanted chain', wantedChain)
		await accounts.connectWalletProvider(wantedChain)
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

body.body--dark
	.welcome-section
		a
			color: $primary

.selectable
	padding-top: 1.5em
	&:hover
		background-color: lighten($secondary, 5%)

body.body--light
	.love
		background-color: lighten($secondary, 15%)
		margin-top: 5px
		padding-bottom: 10px

.use-cases
	.q-card
		background-color: $primary
		color: $secondary
		height: 100%
		.q-card__section:nth-child(1)
			background-image: url('../../public/bg-hero.svg') !important
			background-size: cover !important
			min-height: 100px
</style>
