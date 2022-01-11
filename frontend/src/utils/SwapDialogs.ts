import { Dialog, Notify, openURL } from 'quasar'
import TokenChooserDialog from '@/utils/dialogs/TokenChooserDialog.vue'

class SwapDialogs {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static approvalDialog: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static swapDialog: any

	private static TIMEOUT = 20_000

	static startTokenApproval(): void {
		SwapDialogs.approvalDialog = Dialog.create({
			dark: true,
			title: `Token approval in progress...`,
			message: 'Waiting for blockchain confirmations',
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
			message: `Your token approval was processed succesfully.`,
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: SwapDialogs.TIMEOUT,
			progress: true,
			actions: [
				{
					label: 'View',
					color: 'white',
					noDismiss: true,
					handler: () => {
						openURL(txnLink)
					},
				},
				{
					label: 'Close',
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
			message: `Your token approval couldn't be processed.`,
			timeout: 0,
			actions: [
				{
					label: 'Close',
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
			title: `Swap in progress...`,
			message: 'Waiting for blockchain confirmations',
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
			message: `Your swap was processed succesfully.`,
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: SwapDialogs.TIMEOUT,
			progress: true,
			actions: [
				{
					label: 'View',
					color: 'white',
					noDismiss: true,
					handler: () => {
						openURL(txnLink)
					},
				},
				{
					label: 'Close',
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
			message: `Your swap couldn't be processed.`,
			timeout: 0,
			actions: [
				{
					label: 'Close',
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
