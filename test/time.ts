import { ethers } from "hardhat";

export async function advanceBlock() {
	return ethers.provider.send("evm_mine", []);
}

export async function increaseTo(target: number) {
  const now = (await ethers.provider.getBlock('latest')).timestamp;
  if (target < now) {
		throw Error(`Cannot increase current time (${now}) to a moment in the past (${target})`);
	}
  const diff = target - now;
  await ethers.provider.send("evm_increaseTime", [ diff ]);
	await advanceBlock();
}
