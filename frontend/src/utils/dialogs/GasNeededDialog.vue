<template>
	<q-dialog ref="dialog" @hide="onDialogHide">
		<q-card class="q-dialog-plugin">
			<q-card-section>
				<div class="text-h5 q-mt-sm q-mb-xs">Running low on BNB for fees</div>
			</q-card-section>
			<q-card-section horizontal>
				<q-card-section class="q-pt-xs">
					<div class="text-white">
						<p>Your current balance of {{ bnbBalance }} BNB is too low for wrapping/unwrapping.</p>
						<p>
							Binance Smart Chain does not need a lot of BNB for transaction fees, but it is best to buy at least $10
							worth of BNB and send them to this wallet.
						</p>
					</div>
				</q-card-section>
				<q-card-section class="col-5 flex flex-center">
					<q-img src="binance-coin.png" width="128px" height="128px" />
				</q-card-section>
			</q-card-section>
			<q-card-actions align="right">
				<q-btn color="primary" text-color="secondary" label="OK" @click="onOKClick" />
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>

<script lang="ts">
import { Component, Ref, Prop, Vue } from 'vue-property-decorator'

@Component
export default class GasNeededDialog extends Vue {
	@Prop({ type: Number, required: true }) bnbBalance!: number

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
	min-width: 500px
	a
		color: $primary
</style>