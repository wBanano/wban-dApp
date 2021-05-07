import { ethers } from "hardhat";

export async function advanceBlock() {
	return ethers.provider.send("evm_mine", []);
}

export async function advanceBlockTo(target: number) {
  const currentBlock = (await latestBlock());
  const start = Date.now();
  let notified;
  if (target < currentBlock) {
		throw Error(`Target block #(${target}) is lower than current block #(${currentBlock})`);
	}
  while ((await latestBlock()) < target) {
    if (!notified && Date.now() - start >= 5000) {
      notified = true;
      console.log('advanceBlockTo: Advancing too many blocks is causing this test to be slow.');
    }
    await advanceBlock();
  }
}

async function latestBlock() {
  return await ethers.provider.send("eth_blockNumber", []);
}
