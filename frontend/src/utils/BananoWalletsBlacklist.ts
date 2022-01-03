import axios from 'axios'

type BlacklistRecord = {
	address: string
	alias: string
	type: string
}

class BananoWalletsBlacklist {
	/**
	 * Check if a BAN wallet/address is blacklisted.
	 * Returns a BlacklistRecord if address is blacklisted, undefined otherwise
	 * @param banWallet the BAN wallet address to check with the blacklist
	 */
	public static async isBlacklisted(banWallet: string): Promise<BlacklistRecord | undefined> {
		const resp = await axios.get('https://kirby.eu.pythonanywhere.com/api/v1/resources/addresses/all')
		const blacklist = resp.data as Array<BlacklistRecord>
		const result = blacklist.find(record => record.address === banWallet)
		console.debug(`Blacklist check for "${banWallet}": ${JSON.stringify(result)}`)
		return result
	}
}

export { BananoWalletsBlacklist, BlacklistRecord }
