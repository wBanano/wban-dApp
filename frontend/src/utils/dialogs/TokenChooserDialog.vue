<template>
	<q-dialog ref="dialog" @hide="onDialogHide">
		<q-card class="q-dialog-plugin">
			<q-card-section class="row items-center">
				<div class="text-h5 q-mt-sm q-mb-xs">Select a token</div>
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
					placeholder="Filter by token"
					debounce="500"
					@input="filterTokens($event)"
				>
					<template v-slot:prepend>
						<q-icon name="search" />
					</template>
				</q-input>
			</q-card-section>
			<q-card-section style="max-height: 60vh; min-height: 50vh" class="scroll">
				<q-list>
					<token-chooser-item
						v-for="token in tokens"
						v-bind:key="token.symbol"
						:token="token"
						@click="onTokenChosen(token)"
					/>
					<q-inner-loading :showing="loading">
						<q-spinner-gears size="50px" color="primary" />
					</q-inner-loading>
				</q-list>
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

	async filterTokens(search: string) {
		if (!search) {
			this.tokens = this.allTokens
		} else {
			this.loading = true
			this.tokens = await TokensUtil.filterTokens(search, this.user, this.provider)
			this.loading = false
		}
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
		this.allTokens = await TokensUtil.getAllTokens(this.user, this.provider)
		this.tokens = this.allTokens
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
