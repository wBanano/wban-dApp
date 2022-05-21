import ReceiptsUtil from "../test/ReceiptsUtil";
import { BigNumber, Signature } from "ethers";

const { ethers } = require("hardhat");

async function main() {
	const wbanAddress = process.env.WBAN_ADDRESS;
	const to = process.env.TO_ADDRESS ?? '';
	const amount = ethers.utils.parseEther("19");

	const signers = await ethers.getSigners();
	const owner = signers[0];

	const uuid = BigNumber.from(Date.now());
	const sig: Signature = await ReceiptsUtil.createReceipt(owner, to, amount, uuid, await owner.getChainId());

	const wban = await ethers.getContractAt("WBANToken", wbanAddress);
	await wban.mintWithReceipt(to, amount, uuid, sig.v, sig.r, sig.s);
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
