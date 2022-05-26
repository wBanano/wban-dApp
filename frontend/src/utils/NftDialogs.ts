import { Dialog } from 'quasar'
import i18n from '@/i18n'

class NftDialogs {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static claimNftDialog: any

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static startNftClaims(count: number): any {
		return Dialog.create({
			dark: true,
			title: i18n.t('dialogs.nft.title').toString(),
			message: i18n.t('dialogs.nft.proceed', { count: count }).toString(),
			persistent: true,
			cancel: true,
			ok: true,
		})
	}

	static claimNft(count: number, total: number) {
		if (NftDialogs.claimNftDialog === undefined) {
			NftDialogs.claimNftDialog = Dialog.create({
				dark: true,
				title: i18n.t('dialogs.nft.title').toString(),
				message: i18n.t('dialogs.nft.claiming', { count: count, total: total }).toString(),
				progress: true,
				persistent: true,
				cancel: true,
				ok: false,
			})
		} else {
			NftDialogs.claimNftDialog.update({
				message: i18n.t('dialogs.nft.claiming', { count: count, total: total }).toString(),
			})
		}
	}

	static endClaimNft() {
		if (NftDialogs.claimNftDialog !== undefined) {
			NftDialogs.claimNftDialog.hide()
			NftDialogs.claimNftDialog = undefined
		}
	}
}

export default NftDialogs
