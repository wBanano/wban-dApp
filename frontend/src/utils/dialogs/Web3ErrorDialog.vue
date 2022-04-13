<template>
	<q-dialog ref="dialog" @hide="onDialogHide">
		<q-card class="q-dialog-plugin">
			<q-card-section>
				<div class="text-h5 q-mt-sm q-mb-xs">{{ title }}</div>
			</q-card-section>
			<q-card-section horizontal>
				<q-card-section class="q-pt-xs">
					<div class="text-white">
						<span v-html="message"></span>
					</div>
				</q-card-section>
				<q-card-section class="col-5 flex flex-center">
					<q-icon name="img:metamask.svg" size="10em" />
				</q-card-section>
			</q-card-section>
			<q-card-actions align="right">
				<q-btn color="primary" text-color="secondary" label="OK" @click="onOKClick" />
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator'

@Component
export default class Web3ErrorDialog extends Vue {
	@Prop({ type: String, required: true }) title!: string
	@Prop({ type: String, required: true }) message!: string

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
	min-width: 550px
	a
		color: $primary
</style>
