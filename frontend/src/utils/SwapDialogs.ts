import { Dialog, Notify, openURL } from 'quasar'
import TokenChooserDialog from '@/utils/dialogs/TokenChooserDialog.vue'
import i18n from '@/i18n'

class SwapDialogs {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static approvalDialog: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static swapDialog: any

	private static TIMEOUT = 20_000

	static startTokenApproval(): void {
		SwapDialogs.approvalDialog = Dialog.create({
			dark: true,
			title: i18n.t('dialogs.token-approval').toString(),
			message: i18n.t('dialogs.waiting-for-blockchain').toString(),
			progress: true,
			persistent: true,
			cancel: false,
			ok: false,
		})
	}

	static confirmTokenApproval(txnHash: string, txnLink: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: i18n.t('notifications.token-approval-success').toString(),
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: SwapDialogs.TIMEOUT,
			progress: true,
			actions: [
				{
					label: i18n.t('notifications.view').toString(),
					color: 'white',
					noDismiss: true,
					handler: () => {
						openURL(txnLink)
					},
				},
				{
					label: i18n.t('notifications.close').toString(),
					color: 'white',
					handler: () => dismiss(),
				},
			],
		})
		if (SwapDialogs.approvalDialog) {
			SwapDialogs.approvalDialog.hide()
			SwapDialogs.approvalDialog = null
		}
	}

	static errorTokenApproval(): void {
		const dismiss = Notify.create({
			type: 'negative',
			html: true,
			message: i18n.t('notifications.token-approval-error').toString(),
			timeout: 0,
			actions: [
				{
					label: i18n.t('notifications.close').toString(),
					color: 'white',
					handler: () => dismiss(),
				},
			],
		})
		if (SwapDialogs.approvalDialog) {
			SwapDialogs.approvalDialog.hide()
			SwapDialogs.approvalDialog = null
		}
	}

	static startSwap(): void {
		SwapDialogs.swapDialog = Dialog.create({
			dark: true,
			title: i18n.t('dialogs.swap-in-progress').toString(),
			message: i18n.t('dialogs.waiting-for-blockchain').toString(),
			progress: true,
			persistent: true,
			cancel: false,
			ok: false,
		})
	}

	static confirmSwap(txnHash: string, txnLink: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: i18n.t('notifications.swap-success').toString(),
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: SwapDialogs.TIMEOUT,
			progress: true,
			actions: [
				{
					label: i18n.t('notifications.view').toString(),
					color: 'white',
					noDismiss: true,
					handler: () => {
						openURL(txnLink)
					},
				},
				{
					label: i18n.t('notifications.close').toString(),
					color: 'white',
					handler: () => dismiss(),
				},
			],
		})
		if (SwapDialogs.swapDialog) {
			SwapDialogs.swapDialog.hide()
			SwapDialogs.swapDialog = null
		}
	}

	static errorSwap(): void {
		const dismiss = Notify.create({
			type: 'negative',
			html: true,
			message: i18n.t('notifications.swap-error').toString(),
			timeout: 0,
			actions: [
				{
					label: i18n.t('notifications.close').toString(),
					color: 'white',
					handler: () => dismiss(),
				},
			],
		})
		if (SwapDialogs.swapDialog) {
			SwapDialogs.swapDialog.hide()
			SwapDialogs.swapDialog = null
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static showTokenChooserDialog(parent: any): Promise<any> {
		return new Promise((resolve) => {
			Dialog.create({
				component: TokenChooserDialog,
				parent: parent,
			})
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.onOk((data: any) => resolve(data))
				.onCancel(() => resolve(null))
		})
	}
}

export default SwapDialogs
