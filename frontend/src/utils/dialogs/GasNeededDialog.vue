<template>
	<q-dialog ref="dialog" @hide="onDialogHide">
		<q-card class="q-dialog-plugin">
			<q-card-section>
				<div class="text-h5 q-mt-sm q-mb-xs">Running low on {{ currentBlockchain.nativeCurrency.symbol }} for fees</div>
			</q-card-section>
			<q-card-section horizontal>
				<q-card-section class="q-pt-xs">
					<div class="text-white">
						<p>
							Your current balance of {{ balance }} {{ currentBlockchain.nativeCurrency.symbol }} is too low for
							wrapping.
						</p>
						<p>
							{{ currentBlockchain.chainName }} does not need a lot of {{ currentBlockchain.nativeCurrency.symbol }} for
							transaction fees, but it is best to buy at least {{ currentBlockchain.minimumNeededForWrap }}
							{{ currentBlockchain.nativeCurrency.symbol }} and send them to this wallet.
						</p>
					</div>
				</q-card-section>
				<q-card-section class="col-5 flex flex-center">
					<img
						:src="require(`@/assets/${currentBlockchainBlockchain.nativeCurrency.symbol.toLowerCase()}-coin.png`)"
						width="128px"
						height="128px"
					/>
				</q-card-section>
			</q-card-section>
			<q-card-actions align="right">
				<q-btn color="primary" text-color="secondary" label="OK" @click="onOKClick" />
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>

<script lang="ts">
import { Network } from '@ethersproject/providers'
import { Component, Ref, Prop, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'

const accountsStore = namespace('accounts')

@Component
export default class GasNeededDialog extends Vue {
	@Prop({ type: Number, required: true }) balance!: number

	@accountsStore.State('network')
	currentBlockchain!: Network

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

	onOKClick() {
		// on OK, it is REQUIRED to
		// emit "ok" event (with optional payload)
		// before hiding the QDialog
		this.$emit('ok')
		// or with payload: this.$emit('ok', { ... })

		// then hiding dialog
		this.hide()
	}

	onCancelClick() {
		this.hide()
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
