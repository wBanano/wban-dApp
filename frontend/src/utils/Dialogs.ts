import { Dialog, Notify, openURL } from 'quasar'
import i18n from '@/i18n'
import BANDepositDialog from '@/utils/dialogs/BANDepositDialog.vue'
import BANWithdrawDialog from '@/utils/dialogs/BANWithdrawDialog.vue'
import Web3ErrorDialog from '@/utils/dialogs/Web3ErrorDialog.vue'
import GasNeededDialog from '@/utils/dialogs/GasNeededDialog.vue'
import LowAmountToWrapDialog from '@/utils/dialogs/LowAmountToWrapDialog.vue'
import FarmDepositDialog from '@/utils/dialogs/FarmDepositDialog.vue'
import FarmWithdrawDialog from '@/utils/dialogs/FarmWithdrawDialog.vue'
import { FarmConfig } from '@/config/constants/types'
import { Signer } from 'ethers'

class Dialogs {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static withdrawalDialog: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static swapToWBanDialog: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static swapToBanDialog: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static farmZapDialog: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static farmDepositDialog: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static farmWithdrawDialog: any

	private static TIMEOUT = 20_000

	static startDeposit(): void {
		Dialog.create({
			component: BANDepositDialog,
		})
	}

	static confirmUserDeposit(deposit: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: i18n.t('notifications.ban-deposit-confirmed.message', { amount: deposit }).toString(),
			caption: i18n.t('notifications.ban-deposit-confirmed.caption').toString(),
			timeout: Dialogs.TIMEOUT,
			progress: true,
			actions: [
				{
					label: i18n.t('notifications.close').toString(),
					color: 'white',
					handler: () => dismiss(),
				},
			],
		})
	}

	static declineUserDeposit(deposit: string): void {
		const dismiss = Notify.create({
			type: 'warning',
			html: true,
			message: i18n.t('notifications.ban-deposit-declined.message', { amount: deposit }).toString(),
			caption: i18n.t('notifications.ban-deposit-declined.caption').toString(),
			timeout: 0,
			actions: [
				{
					label: i18n.t('notifications.close').toString(),
					color: 'secondary',
					handler: () => dismiss(),
				},
			],
		})
	}

	static initiateWithdrawal(): void {
		Dialog.create({
			component: BANWithdrawDialog,
		})
	}

	static startWithdrawal(): void {
		Dialogs.withdrawalDialog = Dialog.create({
			dark: true,
			title: i18n.t('dialogs.withdrawal.title').toString(),
			message: i18n.t('dialogs.withdrawal.message').toString(),
			progress: true,
			persistent: true,
			cancel: false,
			ok: false,
		})
	}

	static showWithdrawalAsPending(withdrawal: number): void {
		Dialogs.withdrawalDialog.update({
			title: i18n.t('dialogs.pending-withdrawal.title').toString(),
			message: i18n.t('dialogs.pending-withdrawal.title', { amount: withdrawal }).toString(),
			progress: false,
			ok: {
				color: 'primary',
				'text-color': 'secondary',
			},
			html: true,
		})
		Dialogs.withdrawalDialog = null
	}

	static showWithdrawalSuccess(withdrawal: string, txnHash: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: i18n.t('notifications.withdrawal', { amount: withdrawal }).toString(),
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: Dialogs.TIMEOUT,
			progress: true,
			actions: [
				{
					label: i18n.t('notifications.view').toString(),
					color: 'white',
					noDismiss: true,
					handler: () => {
						openURL(`https://creeper.banano.cc/explorer/block/${txnHash}`)
					},
				},
				{
					label: i18n.t('notifications.close').toString(),
					color: 'white',
					handler: () => dismiss(),
				},
			],
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
			message: i18n.t('notifications.pending-withdrawal.message', { amount: withdrawal }).toString(),
			caption: i18n.t('notifications.pending-withdrawal.caption').toString(),
			timeout: 0,
			actions: [
				{
					label: i18n.t('notifications.close').toString(),
					color: 'white',
					handler: () => dismiss(),
				},
			],
		})
		if (Dialogs.withdrawalDialog) {
			Dialogs.withdrawalDialog.hide()
			Dialogs.withdrawalDialog = null
		}
	}

	static startSwapToWBan(amount: string): void {
		Dialogs.swapToWBanDialog = Dialog.create({
			dark: true,
			title: i18n.t('dialogs.wrap.title', { amount }).toString(),
			message: i18n.t('dialogs.wrap.message').toString(),
			progress: true,
			persistent: true,
			cancel: false,
			ok: false,
		})
	}

	static confirmSwapToWBan(deposit: string, txnHash: string, txnLink: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: i18n.t('notifications.wrap', { amount: deposit }).toString(),
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: Dialogs.TIMEOUT,
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
		if (Dialogs.swapToWBanDialog) {
			Dialogs.swapToWBanDialog.hide()
			Dialogs.swapToWBanDialog = null
		}
	}

	static errorSwapToWBan(deposit: string): void {
		const dismiss = Notify.create({
			type: 'negative',
			html: true,
			message: i18n.t('notifications.wrap-error.message', { amount: deposit }).toString(),
			caption: i18n.t('notifications.wrap-error.caption').toString(),
			timeout: 0,
			actions: [
				{
					label: i18n.t('notifications.close').toString(),
					color: 'white',
					handler: () => dismiss(),
				},
			],
		})
		if (Dialogs.swapToWBanDialog) {
			Dialogs.swapToWBanDialog.hide()
			Dialogs.swapToWBanDialog = null
		}
	}

	static startSwapToBan(amount: string): void {
		Dialogs.swapToBanDialog = Dialog.create({
			dark: true,
			title: i18n.t('dialogs.unwrap.title', { amount }).toString(),
			message: i18n.t('dialogs.unwrap.message').toString(),
			progress: true,
			persistent: true,
			cancel: false,
			ok: false,
		})
	}

	static confirmSwapToBan(deposit: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: i18n.t('notifications.unwrap.message', { amount: deposit }).toString(),
			caption: i18n.t('notifications.unwrap.caption').toString(),
			timeout: Dialogs.TIMEOUT,
			progress: true,
			actions: [
				{
					label: i18n.t('notifications.close').toString(),
					color: 'white',
					handler: () => dismiss(),
				},
			],
		})
		if (Dialogs.swapToBanDialog) {
			Dialogs.swapToBanDialog.hide()
			Dialogs.swapToBanDialog = null
		}
	}

	static startFarmDepositDialog(farm: FarmConfig, signer: Signer): void {
		Dialogs.farmDepositDialog = Dialog.create({
			component: FarmDepositDialog,
			farm,
			signer,
		})
	}

	static startFarmZapProgress(amount: string, symbol: string): void {
		Dialogs.farmZapDialog = Dialog.create({
			dark: true,
			title: i18n.t('dialogs.farm-zap.title', { amount, symbol }).toString(),
			message: i18n.t('dialogs.farm-zap.message').toString(),
			progress: true,
			persistent: true,
			cancel: false,
			ok: false,
		})
	}

	static confirmFarmZapIn(amount: string, symbol: string, txnHash: string, txnLink: string): void {
		const dismiss = Notify.create({
			type: 'warning',
			html: true,
			message: i18n.t('notifications.farm-zap-in', { amount, symbol }).toString(),
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: Dialogs.TIMEOUT,
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
		if (Dialogs.farmZapDialog) {
			Dialogs.farmZapDialog.hide()
			Dialogs.farmZapDialog = null
		}
	}

	static confirmFarmZapOut(amount: string, symbol: string, txnHash: string, txnLink: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: i18n.t('notifications.farm-zap-out', { amount, symbol }).toString(),
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: Dialogs.TIMEOUT,
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
		if (Dialogs.farmZapDialog) {
			Dialogs.farmZapDialog.hide()
			Dialogs.farmZapDialog = null
		}
	}

	static startFarmDepositProgress(amount: string, symbol: string): void {
		Dialogs.farmDepositDialog = Dialog.create({
			dark: true,
			title: i18n.t('dialogs.farm-deposit.title', { amount, symbol }).toString(),
			message: i18n.t('dialogs.farm-deposit.message').toString(),
			progress: true,
			persistent: true,
			cancel: false,
			ok: false,
		})
	}

	static confirmFarmDeposit(amount: string, symbol: string, txnHash: string, txnLink: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: i18n.t('notifications.farm-deposit', { amount, symbol }).toString(),
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: Dialogs.TIMEOUT,
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
		if (Dialogs.farmDepositDialog) {
			Dialogs.farmDepositDialog.hide()
			Dialogs.farmDepositDialog = null
		}
	}

	static startFarmWithdrawDialog(farm: FarmConfig, signer: Signer): void {
		Dialogs.farmWithdrawDialog = Dialog.create({
			component: FarmWithdrawDialog,
			farm,
			signer,
		})
	}

	static startFarmWithdraw(amount: string, symbol: string): void {
		Dialogs.farmWithdrawDialog = Dialog.create({
			dark: true,
			title: i18n.t('dialogs.farm-withdraw.title', { amount, symbol }).toString(),
			message: i18n.t('dialogs.farm-withdraw.message').toString(),
			progress: true,
			persistent: true,
			cancel: false,
			ok: false,
		})
	}

	static confirmFarmWithdraw(amount: string, symbol: string, txnHash: string, txnLink: string): void {
		const dismiss = Notify.create({
			type: 'positive',
			html: true,
			message: i18n.t('notifications.farm-withdraw', { amount, symbol }).toString(),
			caption: `Txn: <span class="banano-transaction-hash">${txnHash}</span>`,
			timeout: Dialogs.TIMEOUT,
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
		if (Dialogs.farmWithdrawDialog) {
			Dialogs.farmWithdrawDialog.hide()
			Dialogs.farmWithdrawDialog = null
		}
	}

	static showUnsupportedNetwork(chainId: string): Promise<void> {
		return new Promise((resolve) => {
			const networkName = chainId === '0x1' ? 'Ethereum' : chainId.toString()
			Dialog.create({
				component: Web3ErrorDialog,
				title: i18n.t('dialogs.unsupported-network.title', { network: networkName }).toString(),
				message: i18n.t('dialogs.unsupported-network.message').toString(),
				html: true,
			}).onOk(() => resolve())
		})
	}

	static showGasNeededError(balance: number) {
		Dialog.create({
			component: GasNeededDialog,
			balance: balance,
		})
	}

	static showLowAmountToWrapWarning(amount: number): Promise<boolean> {
		return new Promise((resolve) => {
			Dialog.create({ component: LowAmountToWrapDialog, amount: amount })
				.onOk(() => resolve(true))
				.onCancel(() => resolve(false))
		})
	}
}

export default Dialogs
