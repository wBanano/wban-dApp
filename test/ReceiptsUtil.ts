import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ethers, Signature } from "ethers";

class ReceiptsUtil {
	static async createReceipt(signer: SignerWithAddress, address: string, amount: BigNumber, uuid: BigNumber): Promise<Signature> {
		const payload = ethers.utils.defaultAbiCoder.encode(
			["address", "uint256", "uint256"],
			[address, amount, uuid]
		);
		const payloadHash = ethers.utils.keccak256(payload);
		const signature = await signer.signMessage(ethers.utils.arrayify(payloadHash));
		const sig: Signature = ethers.utils.splitSignature(signature);
		return sig;
	}
}

export default ReceiptsUtil;
