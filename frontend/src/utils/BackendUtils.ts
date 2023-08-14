import { getBackendHost } from '@/config/constants/backend'
import axios, { AxiosResponse, AxiosError } from 'axios'
import { toDataURL } from 'qrcode'

class BackendUtils {
	static async checkIfSetupDone(banWallet: string, bcWallet: string): Promise<boolean | string> {
		console.debug(`Checking if setup is already done for BAN ${banWallet} and BC ${bcWallet} at ${getBackendHost()}`)
		try {
			await axios.get(`${getBackendHost()}/claim/${banWallet}/${bcWallet}`)
			console.debug('Bridge setup already done')
			return true
		} catch (err: unknown | AxiosError) {
			if (axios.isAxiosError(err)) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const response: AxiosResponse = (err as AxiosError).response!
				switch (response.status) {
					case 404:
						console.warn('Bridge setup has to be done')
						return false
					// unexpected error
					default:
						console.error(response.data.message)
						return response.data.message
				}
			}
			throw new Error('Unexpected error')
		}
	}

	static async getDepositsWalletQRCode(banWallet: string): Promise<string> {
		try {
			console.warn('BAN wallet for deposits', banWallet)
			const qrcode: string = await toDataURL(banWallet, {
				scale: 6,
				color: {
					dark: '2A2A2E',
					light: 'FBDD11',
				},
			})
			return `img:${qrcode}`
		} catch (err) {
			console.error(err)
			throw Error(`Can't generate QRCode for deposits wallet ${banWallet}`)
		}
	}
}

export default BackendUtils
