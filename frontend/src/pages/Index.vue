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
		<div v-if="!isUserConnected">
			Make a great page explaining here what wBAN is all about and to invite user to click on the connect button :)
		</div>
	</q-page>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import router from '@/router'
import Statistics from '@/components/Statistics.vue'
import ChainInfo from '@/components/ChainInfo.vue'

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
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

@media (min-width: $breakpoint-md-min)
	.q-page
		background-image: url('../../public/blocklettuce.png')
		background-position: right
		background-repeat: no-repeat
		background-size: contain
</style>
