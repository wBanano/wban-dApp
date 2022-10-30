import { WBANTokenWithPermit } from '@artifacts/typechain'
import { ethers, providers, BigNumber, BigNumberish, Signature } from 'ethers'
import { TypedDataDomain, TypedDataField } from 'ethers/node_modules/@ethersproject/abstract-signer'

class PermitUtil {
	static async createPermitSignature(
		wban: WBANTokenWithPermit,
		owner: providers.JsonRpcSigner,
		spender: string,
		value: BigNumberish,
		deadline: BigNumberish,
		chainId: BigNumberish
	): Promise<Signature> {
		return PermitUtil.createPermitSignatureForToken(
			'Wrapped Banano',
			'1',
			wban.address,
			owner,
			spender,
			value,
			await wban.nonces(owner.getAddress()),
			deadline,
			chainId
		)
	}

	static async createPermitSignatureForToken(
		name: string,
		version: string,
		verifyingContract: string,
		owner: providers.JsonRpcSigner,
		spender: string,
		value: BigNumberish,
		nonce: BigNumber,
		deadline: BigNumberish,
		chainId: BigNumberish
	): Promise<Signature> {
		const domain: TypedDataDomain = { name, version, chainId, verifyingContract }
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
			owner: await owner.getAddress(),
			spender,
			value: value,
			nonce: nonce.toHexString(),
			deadline,
		}
		const signature = await owner._signTypedData(domain, types, message)
		const sig: Signature = ethers.utils.splitSignature(signature)
		return sig
	}
}

export default PermitUtil
