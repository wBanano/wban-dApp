<template>
	<q-dialog ref="dialog" @hide="onDialogHide">
		<q-card class="ban-withdrawal-dialog">
			<form @submit.prevent.stop="withdrawBAN">
				<q-card-section class="row items-center q-pb-none">
					<div class="text-h6">{{ $t('dialogs.ban-withdrawal.title') }}</div>
					<q-space />
					<q-btn icon="close" flat round dense v-close-popup color="white" />
				</q-card-section>
				<q-card-section class="q-gutter-sm">
					<swap-currency-input
						ref="currency-input"
						label=""
						:amount.sync="withdrawAmount"
						:balance="banBalance"
						currency="BAN"
						editable
					/>
				</q-card-section>
				<q-card-actions align="right">
					<q-btn flat :label="$t('cancel')" color="primary" v-close-popup />
					<q-btn type="submit" color="primary" text-color="secondary" :label="$t('withdraw')" />
				</q-card-actions>
			</form>
		</q-card>
	</q-dialog>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import ban from '@/store/modules/ban'
import accounts from '@/store/modules/accounts'
import backend from '@/store/modules/backend'
import { BigNumber } from 'ethers'
import { WithdrawRequest } from '@/models/WithdrawRequest'
import SwapCurrencyInput from '@/components/SwapCurrencyInput.vue'

const backendStore = namespace('backend')

@Component({
	components: {
		SwapCurrencyInput,
	},
})
export default class BANWithdrawDialog extends Vue {
	public withdrawAmount = ''

	@backendStore.Getter('banDeposited')
	banBalance!: BigNumber

	@Ref('currency-input') readonly currencyInput!: SwapCurrencyInput

	@Ref('dialog')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private dialog: any

	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	async withdrawBAN() {
		if (accounts.activeAccount) {
			try {
				if (!this.currencyInput.validate()) {
					return
				}
				await backend.withdrawBAN({
					amount: Number.parseFloat(this.withdrawAmount),
					// amount: Number.parseInt(ethers.utils.formatEther(this.banBalance)),
					banAddress: ban.banAddress,
					blockchainAddress: accounts.activeAccount,
					provider: accounts.providerEthers,
				} as WithdrawRequest)
				this.withdrawAmount = ''
				this.hide()
				this.$emit('withdrawal')
			} catch (err) {
				console.error("Withdrawal can't be done", err)
			}
		}
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
	button
		color: $primary

@media (min-width: $breakpoint-sm-min)
	.q-dialog-plugin
		min-width: 500px
</style>
