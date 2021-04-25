const { ethers, upgrades } = require("hardhat");

async function main() {
  const WBANToken = await ethers.getContractFactory("WBANToken");
  const wban = await upgrades.deployProxy(WBANToken);
  await wban.deployed();
  console.log("wBAN deployed to:", wban.address);
}

main();
