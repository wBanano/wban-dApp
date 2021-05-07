// const { ethers } = require("hardhat");
const verify = require("@nomiclabs/hardhat-etherscan");

async function main() {
	const benisAddress = process.env.BENIS_ADDRESS;
	const pid = process.env.PID;

	const benis = await ethers.getContractAt("Benis", benisAddress)
	await benis.set(pid, 0, true)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
