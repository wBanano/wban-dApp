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
		<div v-if="!isUserConnected" class="welcome-section q-pa-md row justify-center">
			<div class="col-lg-5 col-md-6 col-sm-9 col-xs-12 text-center">
				<div v-if="!$q.platform.is.mobile" class="love row justify-center items-center q-col-gutter-lg">
					<div class="col text-right">
						<q-img src="banano-logo-vertical.svg" />
					</div>
					<div class="col-1">
						<q-icon name="add_circle" color="positive" size="2em" />
					</div>
					<div class="col">
						<img :src="require(`@/assets/${expectedBlockchain.network}-logo.svg`)" />
					</div>
					<div class="col-1 text-positive" style="font-size: 2em; font-weight: bold;">
						=
					</div>
					<div class="col-3 text-left">
						<img :src="require(`@/assets/wban-logo-${expectedBlockchain.network}.svg`)" width="150px" />
					</div>
				</div>
				<img
					v-if="$q.platform.is.mobile"
					:src="require(`@/assets/wban-logo-${expectedBlockchain.network}.svg`)"
					width="150px"
				/>
				<h3>
					wBAN is wrapped <a href="https://banano.cc">Banano</a> on
					<a :href="expectedBlockchain.chainUrl" target="_blank">{{ expectedBlockchain.chainName }}</a>
				</h3>
				<q-btn @click="connectWalletProvider" size="xl" color="primary" text-color="secondary" label="connect" />
				<div v-if="!$q.platform.is.mobile">
					<h4>What can you do with wBAN?</h4>
					<div class="use-cases row items-stretch q-col-gutter-md">
						<div class="col">
							<q-card>
								<q-card-section>
									<div class="text-h5">Swap with other crypto</div>
								</q-card-section>
								<q-card-section>
									<p>Swap from BAN to wBAN to your preferred crypto or vice-versa</p>
								</q-card-section>
							</q-card>
						</div>
						<div class="col">
							<q-card>
								<q-card-section>
									<div class="text-h5">Earn some wBAN</div>
								</q-card-section>
								<q-card-section>
									<p>Earn extra wBAN by providing liquidity to pools</p>
								</q-card-section>
							</q-card>
						</div>
						<div class="col">
							<q-card>
								<q-card-section>
									<div class="text-h5">Learn DeFi</div>
								</q-card-section>
								<q-card-section>
									<p>Without risking much of your hard earned BAN</p>
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
import ban from '@/store/modules/ban'
import accounts from '@/store/modules/accounts'
import { Network, Networks } from '@/utils/Networks'

const accountsStore = namespace('accounts')
const banStore = namespace('ban')

@Component({
	components: {
		Statistics,
		ChainInfo
	}
})
export default class PageIndex extends Vue {
	@accountsStore.Getter('isUserConnected')
	isUserConnected!: boolean

	@banStore.Getter('banAddress')
	banAddress!: string

	@Watch('isUserConnected')
	redirect() {
		console.log('in redirect')
		if (this.isUserConnected && this.banAddress === '') {
			router.push('/setup')
		} else {
			console.debug(`BAN address: ${this.banAddress}`)
		}
	}

	get expectedBlockchain(): Network {
		return new Networks().getExpectedNetworkData()
	}

	mounted() {
		ban.init()
	}

	async connectWalletProvider() {
		await accounts.connectWalletProvider()
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

body.body--dark
	.welcome-section
		a
			color: $primary

.welcome-section
	h4
		line-height: 1rem

.love col
	width: 100%

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
