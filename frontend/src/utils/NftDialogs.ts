import { Dialog } from 'quasar'

class NftDialogs {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static claimNftDialog: any

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static startNftClaims(count: number): any {
		return Dialog.create({
			dark: true,
			title: 'Claim your NFTs',
			message: `You have ${count} NFT to claim. Proceed?`,
			persistent: true,
			cancel: true,
			ok: true
		})
	}

	static claimNft(count: number, total: number) {
		if (NftDialogs.claimNftDialog === undefined) {
			NftDialogs.claimNftDialog = Dialog.create({
				dark: true,
				title: 'Claim your NFTs',
				message: `Claiming NFT ${count} of ${total}...`,
				progress: true,
				persistent: true,
				cancel: true,
				ok: false
			})
		} else {
			NftDialogs.claimNftDialog.update({
				message: `Claiming NFT ${count} of ${total}...`
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
