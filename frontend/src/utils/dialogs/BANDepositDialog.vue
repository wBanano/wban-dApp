<template>
	<q-dialog ref="dialog" @hide="onDialogHide">
		<q-card>
			<q-card-section class="row items-center q-pb-none">
				<div class="text-h6">{{ $t('dialogs.ban-deposit.title') }}</div>
				<q-space />
				<q-btn icon="close" flat round dense v-close-popup color="white" />
			</q-card-section>
			<q-card-section class="q-gutter-sm">
				<div class="row" v-if="$q.platform.is.desktop">
					<div class="col-sm-9 col-xs-12">
						<p>
							<i18n path="dialogs.ban-deposit.phrase1">
								<span class="banano-address gt-sm">{{ banAddress }}</span>
							</i18n>
							&nbsp;<strong class="banano-address gt-sm">{{ banWalletForDeposits }}</strong>
							<a class="lt-md banano-address" :href="banWalletForDepositsLink">{{ banWalletForDeposits }}</a>
						</p>
						<p v-html="$t('dialogs.ban-deposit.phrase2')" />
					</div>
					<div class="col-sm-3 col-xs-12 text-right">
						<q-icon :name="banWalletForDepositsQRCode" size="200px" />
					</div>
				</div>
				<div class="row" v-else>
					<div class="col-sm-9 col-xs-12">
						<p>
							<i18n path="dialogs.ban-deposit.phrase1">
								<span class="banano-address ellipsis">
									{{ banAddress.substring(0, 16) }}...{{ banAddress.substring(48) }}
								</span>
							</i18n>
							&nbsp;
							<strong class="banano-address ellisis">
								{{ banWalletForDeposits.substring(0, 16) }}...{{ banWalletForDeposits.substring(48) }}
							</strong>
						</p>
						<p v-html="$t('dialogs.ban-deposit.phrase2')" />
					</div>
				</div>
			</q-card-section>
			<q-card-actions align="right" v-if="$q.platform.is.desktop">
				<q-btn
					@click="copyBanAddressForDepositsToClipboard"
					v-if="!$q.platform.is.mobile"
					color="primary"
					text-color="secondary"
					:label="$t('dialogs.ban-deposit.button-copy-address')"
				/>
				<q-btn color="primary" text-color="secondary" :label="$t('ok')" v-close-popup />
			</q-card-actions>
			<q-card-actions align="center" v-else>
				<q-btn
					:href="kalium(banWalletForDeposits)"
					color="primary"
					text-color="secondary"
					:label="$t('menu.donations.kalium')"
				/>
				<q-btn
					@click="copyBanAddressForDepositsToClipboard"
					color="primary"
					text-color="secondary"
					:label="$t('dialogs.ban-deposit.button-copy-address')"
				/>
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>

<script lang="ts">
import ban from '@/store/modules/ban'
import { copyToClipboard } from 'quasar'
import { Component, Ref, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import QRCode from 'qrcode'

const backendStore = namespace('backend')

@Component
export default class BANDepositDialog extends Vue {
	public banAddress = ''
	public banWalletForDepositsQRCode = ''

	@backendStore.Getter('banWalletForDeposits')
	banWalletForDeposits!: string

	@backendStore.Getter('banWalletForDepositsLink')
	banWalletForDepositsLink!: string

	@Ref('dialog')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private dialog: any

	static ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	async copyBanAddressForDepositsToClipboard() {
		try {
			await copyToClipboard(this.banWalletForDeposits)
			this.$q.notify({
				type: 'positive',
				message: 'Address copied',
			})
		} catch (err) {
			this.$q.notify({
				type: 'negative',
				message: "Can't write to clipboard!",
			})
		}
	}

	kalium(wallet: string) {
		return `ban:${wallet}`
	}

	async mounted() {
		console.debug('in mounted')
		this.banAddress = ban.banAddress

		try {
			const qrcode: string = await QRCode.toDataURL(this.banWalletForDeposits, {
				scale: 6,
				color: {
					dark: '2A2A2E',
					light: 'FBDD11',
				},
			})
			this.banWalletForDepositsQRCode = `img:${qrcode}`
		} catch (err) {
			console.error(err)
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
