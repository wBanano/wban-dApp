// const { ethers } = require("hardhat");
const verify = require("@nomiclabs/hardhat-etherscan");

async function main() {
	const benisAddress = process.env.BENIS_ADDRESS;
	const additionalTime = Number.parseInt(process.env.TIME_SECONDS);

	const benis = await ethers.getContractAt("Benis", benisAddress)
	await benis.changeEndTime(additionalTime)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
