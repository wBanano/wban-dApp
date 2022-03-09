<template>
	<q-item clickable @click="$emit('click', $event)">
		<q-item-section avatar rounded>
			<q-avatar size="32px">
				<img :src="token.logoURI" />
			</q-avatar>
		</q-item-section>
		<q-item-section>
			<q-item-label v-html="token.symbol" />
			<q-item-label caption>{{ token.name }}</q-item-label>
		</q-item-section>
		<q-item-section>
			<q-item-label>
				<template v-if="!loading">{{ balanceFormatted }}</template>
				<q-spinner v-if="loading" size="32px" color="primary" />
			</q-item-label>
		</q-item-section>
	</q-item>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Token } from '@/config/constants/dex'
import TokensUtil from '@/utils/TokensUtil'
import { BigNumber, ethers } from 'ethers'
import numeral from 'numeral'

const accountsStore = namespace('accounts')

@Component
export default class TokenChooserItem extends Vue {
	@Prop({ type: Object, required: true }) token!: Token

	@accountsStore.State('activeAccount')
	user!: string

	@accountsStore.Getter('providerEthers')
	provider!: ethers.providers.JsonRpcProvider | null

	balance = ''
	loading = true

	get balanceFormatted(): string {
		return numeral(this.balance).format('0,0[.]00000000')
	}

	async onProviderChange() {
		if (!this.provider) {
			console.error('Missing Web3 provider')
			return
		}
		this.loading = true
		const rawBalance: BigNumber = await TokensUtil.getBalance(this.user, this.token, this.provider)
		this.balance = ethers.utils.formatUnits(rawBalance, this.token.decimals)
		this.loading = false
	}

	async mounted() {
		this.onProviderChange()
		document.addEventListener('web3-connection', this.onProviderChange)
	}

	unmounted() {
		document.removeEventListener('web3-connection', this.onProviderChange)
	}
}
</script>
