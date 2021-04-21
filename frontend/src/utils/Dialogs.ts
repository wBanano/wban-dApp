import { Dialog, Notify, openURL } from 'quasar'

class Dialogs {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static withdrawalDialog: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static swapToWBanDialog: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static swapToBanDialog: any

	static confirmUserDeposit(deposit: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: `Your deposit of ${deposit} BAN was received.`,
			caption: 'You can swap it to wBAN.',
			timeout: 0,
			actions: [
				{
					label: 'Close',
					color: 'white',
					handler: () => dismiss()
				}
			]
		})
	}

	static startWithdrawal(): void {
		Dialogs.withdrawalDialog = Dialog.create({
			dark: true,
			title: 'Withdrawal in progress...',
			message: `Working hard to process your withdrawal!`,
			progress: true,
			persistent: true,
			cancel: false,
			ok: false
		})
	}

	static showWithdrawalAsPending(withdrawal: number): void {
		Dialogs.withdrawalDialog.update({
			title: 'Pending Withdrawal',
			message: `Your withdrawal of ${withdrawal} BAN can't be processed right now.<br /><br /><strong>It has been put in a pending list and will be processed later!</strong><br /><br />Meanwhile your deposited BAN balance won't be reduced from this withdrawal.`,
			progress: false,
			ok: {
				color: 'primary',
				'text-color': 'secondary'
			},
			html: true
		})
		Dialogs.withdrawalDialog = null
	}

	static showWithdrawalSuccess(withdrawal: string, txnHash: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: `${withdrawal} BAN were sent back to your wallet.`,
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: 0,
			actions: [
				{
					label: 'View',
					color: 'white',
					noDismiss: true,
					handler: () => {
						openURL(`https://creeper.banano.cc/explorer/block/${txnHash}`)
					}
				},
				{
					label: 'Close',
					color: 'white',
					handler: () => dismiss()
				}
			]
		})
		if (Dialogs.withdrawalDialog) {
			Dialogs.withdrawalDialog.hide()
			Dialogs.withdrawalDialog = null
		}
	}

	static showPendingWithdrawal(withdrawal: string): void {
		const dismiss = Notify.create({
			type: 'warning',
			html: true,
			message: `Your withdrawal of ${withdrawal} BAN is in pending state.`,
			caption: 'As soon as wBAN hot wallet is refilled from its cold wallet your withdrawal will be done!',
			timeout: 0,
			actions: [
				{
					label: 'Close',
					color: 'white',
					handler: () => dismiss()
				}
			]
		})
		if (Dialogs.withdrawalDialog) {
			Dialogs.withdrawalDialog.hide()
			Dialogs.withdrawalDialog = null
		}
	}

	static startSwapToWBan(amount: string): void {
		Dialogs.swapToWBanDialog = Dialog.create({
			dark: true,
			title: `Swap of ${amount} BAN in progress...`,
			message: 'Working hard to process your swap request!',
			progress: true,
			persistent: true,
			cancel: false,
			ok: false
		})
	}

	static confirmSwapToWBan(deposit: string, txnHash: string, txnLink: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: `Your swap of ${deposit} BAN was processed succesfully.`,
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: 0,
			actions: [
				{
					label: 'View',
					color: 'white',
					noDismiss: true,
					handler: () => {
						openURL(txnLink)
					}
				},
				{
					label: 'Close',
					color: 'white',
					handler: () => dismiss()
				}
			]
		})
		if (Dialogs.swapToWBanDialog) {
			Dialogs.swapToWBanDialog.hide()
			Dialogs.swapToWBanDialog = null
		}
	}

	static startSwapToBan(amount: string): void {
		Dialogs.swapToBanDialog = Dialog.create({
			dark: true,
			title: `Swap of ${amount} wBAN in progress...`,
			message: 'Working hard to process your swap request!',
			progress: true,
			persistent: true,
			cancel: false,
			ok: false
		})
	}

	static confirmSwapToBan(deposit: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: `Your swap of ${deposit} wBAN was processed succesfully.`,
			caption: 'Your balance of deposited Banano has been updated.',
			timeout: 0,
			actions: [
				{
					label: 'Close',
					color: 'white',
					handler: () => dismiss()
				}
			]
		})
		if (Dialogs.swapToBanDialog) {
			Dialogs.swapToBanDialog.hide()
			Dialogs.swapToBanDialog = null
		}
	}
}

export default Dialogs
