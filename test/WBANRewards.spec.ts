import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { WBANToken } from "../artifacts/typechain/WBANToken";
import { MockBEP20 } from "../artifacts/typechain/MockBEP20";
import { ApeFactory } from "../artifacts/typechain/ApeFactory";
import { ApePair } from "../artifacts/typechain/ApePair";
import { BEP20RewardApeV2 } from "../artifacts/typechain/BEP20RewardApeV2";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Signature } from "ethers";
import ReceiptsUtil from "./ReceiptsUtil";
import { advanceBlockTo } from "./time";

chai.use(solidity);
const { expect } = chai;

describe('WBAN LP tokens rewards', () => {
	let wban: WBANToken;
	let wbnb: MockBEP20;
	let lpToken: ApePair;
	let apeRewards: BEP20RewardApeV2;
	let apeRewardsStartBlock: number;
	let apeRewardsEndBlock: number;
	let owner: SignerWithAddress;
	let rewarder: SignerWithAddress;
	let user1: SignerWithAddress;

  beforeEach(async () => {
		const signers = await ethers.getSigners();
		[owner, rewarder, user1] = signers;

		// deploy wBAN contract
		const wBANTokenFactory = await ethers.getContractFactory(
      "WBANToken",
      signers[0]
    );
		wban = (await upgrades.deployProxy(wBANTokenFactory)) as WBANToken;
		await wban.deployed();
		expect(wban.address).to.properAddress;
		console.log(`wBAN deployed at "${wban.address}"`);

		// deploy fake WBNB contract
		const MockBEP20 = await ethers.getContractFactory("MockBEP20", signers[0]);
		const MINTED_WBNB = ethers.utils.parseEther("100");
		wbnb = (await MockBEP20.deploy("BNB", "BNB", MINTED_WBNB)) as MockBEP20;
		await wbnb.deployed();
		expect(wbnb.address).to.properAddress;
		console.log(`WBNB deployed at "${wbnb.address}"`);

		// deploy fake wBAN-WBNB pair
		const ApeFactory = await ethers.getContractFactory("ApeFactory", signers[0]);
		const apeFactory = (await ApeFactory.deploy("0x0000000000000000000000000000000000000000")) as ApeFactory; // no fees
		await apeFactory.deployed();
		expect(apeFactory.address).to.properAddress;
		console.log(`ApeFactory deployed at "${apeFactory.address}"`);

		await apeFactory.createPair(wbnb.address, wban.address);
		const pairAddress = await apeFactory.getPair(wban.address, wbnb.address);
		lpToken = await ethers.getContractAt("ApePair", pairAddress, signers[0]) as ApePair;
		console.log(`ApePair wBAN-WBNB deployed at "${lpToken.address}"`);

		// deploy `BEP20RRewardsApeV2` contract
		const BEP20RRewardsApeV2 = await ethers.getContractFactory("BEP20RewardApeV2", signers[0]);
		const stakeToken = lpToken;
		const rewardsToken = wban;
		const rewardsPerBlock = ethers.utils.parseEther("1000");
		apeRewardsStartBlock = 20;
		apeRewardsEndBlock = apeRewardsStartBlock + 10;
		apeRewards = await BEP20RRewardsApeV2.deploy(
			stakeToken.address, rewardsToken.address, rewardsPerBlock, apeRewardsStartBlock, apeRewardsEndBlock
		) as BEP20RewardApeV2;
		await apeRewards.deployed();
		expect(apeRewards.address).to.properAddress;
		// mint some wBAN rewards
		const wBanRewards = rewardsPerBlock.mul(BigNumber.from(apeRewardsEndBlock - apeRewardsStartBlock));
		const uuid = BigNumber.from(await owner.getTransactionCount());
		const sig: Signature = await ReceiptsUtil.createReceipt(owner, rewarder.address, wBanRewards, uuid);
		const rewarder_wban = wban.connect(rewarder);
		await expect(rewarder_wban.mintWithReceipt(rewarder.address, wBanRewards, uuid, sig.v, sig.r, sig.s))
			.to.emit(wban, 'Transfer')
			.withArgs("0x0000000000000000000000000000000000000000", rewarder.address, wBanRewards);
		// send them to the rewards contract
		rewarder_wban.transfer(apeRewards.address, wBanRewards);
		console.log(`Benis rewards contract deployed at "${apeRewards.address}"`);
	});

	it('Sends some wBAN-WBNB liquidity and stake it', async () => {
		// mint some wBAN first
		const wBanToMint = ethers.utils.parseEther("250000");
		const user1_wban = wban.connect(user1);
		const uuid = BigNumber.from(await user1.getTransactionCount());
		const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid);
		await expect(user1_wban.mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s))
			.to.emit(wban, 'Transfer')
			.withArgs("0x0000000000000000000000000000000000000000", user1.address, wBanToMint);

		// mint some fake WBNB
		const wbnbToMint = ethers.utils.parseEther("10");
		await wbnb.transfer(user1.address, wbnbToMint);
		const user1_wbnb = wbnb.connect(user1);
		expect(await user1_wbnb.balanceOf(user1.address)).to.equal(wbnbToMint);

		// provide liquidity
		let [wbnbReserve, wbanReserve, blockTimestampLast] = await lpToken.getReserves();
		console.debug(`Reserves: ${ethers.utils.formatEther(wbanReserve)} wBAN, ${ethers.utils.formatEther(wbnbReserve)} WBNB`);
		user1_wban.transfer(lpToken.address, wBanToMint);
		user1_wbnb.transfer(lpToken.address, wbnbToMint);
		const user1_lpToken = lpToken.connect(user1);
		expect(await user1_lpToken.totalSupply()).to.equal(BigNumber.from(0));
		await user1_lpToken.mint(user1.address);
		const liquidity: BigNumber = await lpToken.balanceOf(user1.address);
		expect(liquidity.gt(BigNumber.from(0)));
		console.debug(`Liquidity: ${ethers.utils.formatEther(liquidity)} LP tokens`);
		const wbanBalance = ethers.utils.formatEther(await wban.balanceOf(lpToken.address));
		const wbnbBalance = ethers.utils.formatEther(await wbnb.balanceOf(lpToken.address));
		console.debug(`Liquidity pool balances: ${wbanBalance} wBAN, ${wbnbBalance} WBNB`);
		[wbnbReserve, wbanReserve, blockTimestampLast] = await lpToken.getReserves();
		console.debug(`Reserves: ${ethers.utils.formatEther(wbanReserve)} wBAN, ${ethers.utils.formatEther(wbnbReserve)} WBNB`);

		// stake liquidity
		const user1_rewards = apeRewards.connect(user1);
		await user1_lpToken.approve(user1_rewards.address, liquidity);
		await advanceBlockTo(apeRewardsStartBlock - 1);
		await user1_rewards.deposit(liquidity);
		console.debug(`Rewards balance: ${ethers.utils.formatEther(await user1_rewards.rewardBalance())} wBAN`);
		// await advanceBlockTo(apeRewardsStartBlock + 1);
		await advanceBlockTo(apeRewardsEndBlock + 1);
		console.debug(`Pending rewards: ${ethers.utils.formatEther(await apeRewards.pendingReward(user1.address))} wBAN`);
		console.debug(`Rewards balance: ${ethers.utils.formatEther(await user1_rewards.rewardBalance())} wBAN`);
		console.debug(`Total stake balance: ${ethers.utils.formatEther(await apeRewards.totalStakeTokenBalance())} LP`);
		console.debug(`Multiplier: ${await user1_rewards.getMultiplier(0, 1_000_000)}`);

		// unstake liquidity
		await user1_rewards.withdraw(liquidity);
		console.log(`Balance after unstaking: ${ethers.utils.formatEther(await wban.balanceOf(user1.address))} wBAN`);
	});

});
