import { WBANTokenWithPermit } from '@artifacts/typechain'
import { BigNumberish, providers } from 'ethers'
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'

class PermitUtil {
	static async createPermitSignature(
		wban: WBANTokenWithPermit,
		signer: providers.JsonRpcSigner,
		spender: string,
		value: BigNumberish,
		deadline: BigNumberish,
		chainId: BigNumberish
	): Promise<string> {
		const address = await signer.getAddress()
		const domain: TypedDataDomain = {
			name: await wban.name(),
			version: '1',
			chainId,
			verifyingContract: wban.address,
		}
		const types: Record<string, Array<TypedDataField>> = {
			Permit: [
				{ name: 'owner', type: 'address' },
				{ name: 'spender', type: 'address' },
				{ name: 'value', type: 'uint256' },
				{ name: 'nonce', type: 'uint256' },
				{ name: 'deadline', type: 'uint256' },
			],
		}
		const message = {
			owner: address,
			spender,
			value: value,
			nonce: await wban.nonces(address),
			deadline,
		}
		const signature = await signer._signTypedData(domain, types, message)
		// const sig: Signature = ethers.utils.splitSignature(signature)
		return signature
	}
}

export default PermitUtil
