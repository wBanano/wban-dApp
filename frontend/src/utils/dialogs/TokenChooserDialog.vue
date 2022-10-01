<template>
	<q-dialog ref="dialog" @hide="onDialogHide">
		<q-card class="q-dialog-plugin">
			<q-card-section class="row items-center">
				<div class="text-h5 q-mt-sm q-mb-xs">{{ $t('dialogs.token-chooser.title') }}</div>
				<q-space />
				<q-btn icon="close" flat round dense v-close-popup class="text-white" />
			</q-card-section>
			<q-card-section>
				<q-input
					autofocus
					clearable
					rounded
					dense
					outlined
					v-model="search"
					:placeholder="$t('dialogs.token-chooser.placeholder')"
					debounce="500"
					@input="filterTokens($event)"
				>
					<template v-slot:prepend>
						<q-icon name="search" />
					</template>
				</q-input>
			</q-card-section>
			<q-card-section ref="tokensRef" style="max-height: 500px; overflow: auto">
				<q-infinite-scroll ref="tokensList" @load="loadTokens" :offset="500" :scroll-target="$refs.tokensRef">
					<token-chooser-item v-for="(item, index) in tokens" :key="index" :token="item" @click="onTokenChosen(item)" />
					<template v-slot:loading>
						<div class="text-center q-my-md">
							<q-spinner-dots color="primary" size="40px" />
						</div>
					</template>
				</q-infinite-scroll>
			</q-card-section>
		</q-card>
	</q-dialog>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import TokenChooserItem from '@/components/tokens/TokenChooserItem.vue'
import { Token } from '@/config/constants/dex'
import TokensUtil from '@/utils/TokensUtil'
import { ethers } from 'ethers'

const accountsStore = namespace('accounts')

@Component({
	components: {
		TokenChooserItem,
	},
})
export default class TokenChooserDialog extends Vue {
	tokens: Array<Token> = []
	allTokens: Array<Token> = []
	search = ''
	loading = true

	@accountsStore.State('activeAccount')
	user!: string

	@accountsStore.Getter('providerEthers')
	provider!: ethers.providers.JsonRpcProvider | null

	@Ref('dialog')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private dialog: any

	@Ref('tokensList')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private tokensList: any

	show() {
		this.dialog.show()
	}

	hide() {
		this.dialog.hide()
	}

	onDialogHide() {
		// required to be emitted
		// when QDialog emits "hide" event
		this.$emit('hide')
	}

	onCancelClick() {
		this.hide()
	}

	async loadTokens(index: number, done: () => void) {
		if (!this.search) {
			this.tokens = this.allTokens.slice(0, index * 10)
		} else {
			const filteredTokens = await TokensUtil.filterTokens(this.search)
			this.tokens = filteredTokens.slice(0, Math.min(index * 10, filteredTokens.length))
		}
		if (this.tokens.length > 0 && this.tokens.length <= 10) {
			this.tokensList.stop()
		}
		done()
	}

	async filterTokens() {
		this.tokens = []
		this.tokensList.reset()
		this.tokensList.resume()
		this.tokensList.poll()
	}

	onTokenChosen(token: Token) {
		const aToken: Token = {
			name: token.name,
			symbol: token.symbol,
			address: token.address,
			decimals: token.decimals,
			logoURI: token.logoURI,
			chainId: token.chainId,
		}
		this.$emit('ok', aToken)
		// this.$emit('ok', token)
		this.hide()
	}

	async onProviderChange() {
		this.loading = true
		this.allTokens = await TokensUtil.getAllTokens()
		this.tokens = []
		this.loading = false
	}

	async mounted() {
		await this.onProviderChange()
		document.addEventListener('web3-connection', this.onProviderChange)
	}

	unmounted() {
		document.removeEventListener('web3-connection', this.onProviderChange)
	}
}
</script>

<style lang="sass" scoped>
@import '@/styles/quasar.sass'

.q-dialog-plugin
	a
		color: $primary

@media (min-width: $breakpoint-sm-min)
	.q-dialog-plugin
		min-width: 500px
</style>
