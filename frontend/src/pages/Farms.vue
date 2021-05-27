<template>
	<q-page>
		<div class="q-pa-md">
			<div class="row items-center">
				<h6 class="subtitle justify-center offset-md-1">
					<q-btn to="/" icon="arrow_back" text-color="primary" flat style="margin-top: -10px" />
					Home
				</h6>
			</div>
			<div class="row q-col-gutter-md justify-center">
				<farm v-for="farm in farms" :key="farm.pid" :account="activeAccount" :value="farm" />
				<div class="col-md-1" />
			</div>
		</div>
	</q-page>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import Farm from '@/components/farms/Farm.vue'
import benis from '@/store/modules/benis'
import accounts from '@/store/modules/accounts'
import prices from '@/store/modules/prices'
import { FarmConfig, Address } from '@/config/constants/types'
import tokens from '@/config/constants/tokens'
import { ethers } from 'ethers'

const benisStore = namespace('benis')
const accountsStore = namespace('accounts')

@Component({
	components: {
		Farm
	}
})
export default class FarmsPage extends Vue {
	@benisStore.Getter('farms')
	farms!: Array<FarmConfig>

	@accountsStore.State('activeAccount')
	activeAccount!: string

	@accountsStore.Getter('providerEthers')
	provider!: ethers.providers.JsonRpcProvider | null

	wbanAddress: string = tokens.wban.address[Farm.ENV_NAME as keyof Address]

	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	async mounted() {
		await accounts.initWalletProvider()
		await prices.loadPrices()
		await benis.initContract(this.provider)
	}
}
</script>
