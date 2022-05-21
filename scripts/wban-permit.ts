import PermitUtil from "../test/PermitUtil";
import { BigNumber, Signature } from "ethers";

const { ethers } = require("hardhat");

async function main() {
	const wbanAddress = process.env.WBAN_ADDRESS;
	const to = process.env.TO_ADDRESS ?? '';
	const amount = ethers.utils.parseEther("19");

	const signers = await ethers.getSigners();
	const user = signers[1];

	const wban = await ethers.getContractAt("WBANTokenWithPermit", wbanAddress);

	const nonce = BigNumber.from(0);
	const deadline = Math.floor(Date.now() / 1_000) + 24 * 60 * 60; // 24 hours deadline
	console.log("Signing permit allowance from", user.address);
	const sig: Signature = await PermitUtil.createPermitSignature(wban, user, to, amount, nonce, deadline, await user.getChainId());

	console.log('r', sig.r, 's', sig.s, 'v', sig.v);

	await wban.permit(user.address, to, amount, deadline, sig.v, sig.r, sig.s);
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
