import { WBANTokenWithPermit } from "../artifacts/typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, BigNumberish, ethers, Signature } from "ethers";
import { TypedDataDomain, TypedDataField } from "ethers/node_modules/@ethersproject/abstract-signer";

class PermitUtil {
	static async createPermitSignature(
		wban: WBANTokenWithPermit,
		owner: SignerWithAddress,
    spender: string,
    value: BigNumberish,
		nonce: BigNumber,
    deadline: BigNumberish,
		chainId: BigNumberish
	): Promise<Signature> {
    const domain: TypedDataDomain = { name: "Wrapped Banano", version: "1", chainId, verifyingContract: wban.address };
    const types: Record<string, Array<TypedDataField>> = {
      Permit: [
        { name: 'owner', type: 'address' },
				{ name: 'spender', type: 'address' },
				{ name: 'value', type: 'uint256' },
				{ name: 'nonce', type: 'uint256' },
				{ name: 'deadline', type: 'uint256' },
      ],
    };
		const message = {
			owner: owner.address,
			spender,
			value: value,
			nonce: nonce.toHexString(),
			deadline,
		}
    const signature = await owner._signTypedData(domain, types, message);
		const sig: Signature = ethers.utils.splitSignature(signature);
		return sig;
	}
}

export default PermitUtil;
