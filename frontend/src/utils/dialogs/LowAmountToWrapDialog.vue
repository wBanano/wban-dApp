<template>
	<q-dialog ref="dialog" @hide="onDialogHide">
		<q-card class="q-dialog-plugin">
			<q-card-section>
				<div class="text-h5 q-mt-sm q-mb-xs">⚠️ Are you sure?</div>
			</q-card-section>
			<q-card-section horizontal>
				<q-card-section class="q-pt-xs">
					<div class="text-white">
						<p>You are requesting to wrap/unwrap a 🤏 amount of {{ amount }} BAN/wBAN.</p>
						<p>{{ expectedBlockchain.chainName }} network fees may not be worth it for this wrap/unwrap.</p>
					</div>
				</q-card-section>
				<q-card-section class="col-5 flex flex-center">
					<img
						:src="require(`@/assets/${expectedBlockchain.nativeCurrency.symbol.toLowerCase()}-coin.png`)"
						width="128px"
						height="128px"
					/>
				</q-card-section>
			</q-card-section>
			<q-card-actions align="right">
				<q-btn label="Proceed anyway" text-color="primary" flat @click="onOKClick" />
				<q-btn label="Cancel" color="primary" text-color="secondary" @click="onCancelClick" />
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>

<script lang="ts">
import { Component, Ref, Prop, Vue } from 'vue-property-decorator'
import { Network, Networks } from '../Networks'

@Component
export default class LowAmountToWrapDialog extends Vue {
	@Prop({ type: Number, required: true }) amount!: number

	@Ref('dialog')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private dialog: any

	get expectedBlockchain(): Network {
		return new Networks().getExpectedNetworkData()
	}

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
