import { Dialog, Notify, openURL } from 'quasar'

class Dialogs {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static withdrawalDialog: any

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
			message: `Your withdrawal of ${withdrawal} BAN are put in a pending state.`,
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
}

export default Dialogs
