// const { ethers } = require("hardhat");
const verify = require("@nomiclabs/hardhat-etherscan");

async function main() {
	const benisAddress = process.env.BENIS_ADDRESS;
	const lpTokenAddress = process.env.LP_ADDRESS;
	const alloc = process.env.ALLOC;

	const benis = await ethers.getContractAt("Benis", benisAddress)
	await benis.add(alloc, lpTokenAddress, true);
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
