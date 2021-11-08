import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Benis } from "../artifacts/typechain/Benis";
import { WBANToken } from "../artifacts/typechain/WBANToken";
import { MockBEP20 } from "../artifacts/typechain/MockBEP20";
import { ApeFactory } from "../artifacts/typechain/ApeFactory";
import { ApePair } from "../artifacts/typechain/ApePair";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Signature } from "ethers";
import ReceiptsUtil from "./ReceiptsUtil";
import { increaseTo } from "./time";

chai.use(solidity);
const { expect } = chai;

describe('Benis', () => {
	let wban: WBANToken;
	let wbnb: MockBEP20;
	let lpToken: ApePair;
	let benis: Benis;
	let rewardsStartTime: number;
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

		// deploy `Benis` contract
		const Benis = await ethers.getContractFactory("Benis", signers[0]);
		const rewardsPerSecond = ethers.utils.parseEther("1");
		rewardsStartTime = (await ethers.provider.getBlock('latest')).timestamp + 24 * 60 * 60;
		benis = await Benis.deploy(wban.address, rewardsPerSecond, rewardsStartTime) as Benis;
		await benis.deployed();
		expect(benis.address).to.properAddress;
		console.log(`Benis deployed at "${benis.address}"`);

		// mint some wBAN rewards
		const ONE_WEEK = BigNumber.from(7 * 24 * 60 * 60);
		const wBanRewards = rewardsPerSecond.mul(ONE_WEEK);
		console.debug(`Minting ${ethers.utils.formatEther(wBanRewards)} wBAN for rewards over 7 days`);
		const uuid = BigNumber.from(await owner.getTransactionCount());
		const sig: Signature = await ReceiptsUtil.createReceipt(owner, rewarder.address, wBanRewards, uuid, await owner.getChainId());
		const rewarder_wban = wban.connect(rewarder);
		await expect(rewarder_wban.mintWithReceipt(rewarder.address, wBanRewards, uuid, sig.v, sig.r, sig.s))
			.to.emit(wban, 'Transfer')
			.withArgs("0x0000000000000000000000000000000000000000", rewarder.address, wBanRewards);
		// send them to the rewards contract
		rewarder_wban.transfer(benis.address, wBanRewards);
	});

	it('Sends some wBAN-WBNB liquidity and stake it', async () => {
		// mint some wBAN first
		const wBanToMint = ethers.utils.parseEther("10000");
		const user1_wban = wban.connect(user1);
		const uuid = BigNumber.from(await user1.getTransactionCount());
		const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());
		await expect(user1_wban.mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s))
			.to.emit(wban, 'Transfer')
			.withArgs("0x0000000000000000000000000000000000000000", user1.address, wBanToMint);

		// mint some fake WBNB
		const wbnbToMint = ethers.utils.parseEther("0.7936");
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

		// create farm pool
		await benis.add(1_000, lpToken.address, true);
		expect(await benis.poolLength()).to.equal(1);

		// stake liquidity
		const user1_benis = benis.connect(user1);
		await user1_lpToken.approve(user1_benis.address, liquidity);
		await user1_benis.deposit(0, liquidity);
		await increaseTo(rewardsStartTime);
		console.debug(`Current timestamp: ${(await ethers.provider.getBlock('latest')).timestamp}`);
		console.debug(`Rewards balance: ${ethers.utils.formatEther(await user1_benis.pendingWBAN(0, user1.address))} wBAN`);

		await increaseTo(rewardsStartTime + 7 * 24 * 60 * 60);
		console.debug(`Current timestamp: ${(await ethers.provider.getBlock('latest')).timestamp}`);
		console.debug(`Rewards balance: ${ethers.utils.formatEther(await user1_benis.pendingWBAN(0, user1.address))} wBAN`);

		// unstake liquidity
		await user1_benis.withdraw(0, liquidity);
		console.log(`Balance after unstaking: ${ethers.utils.formatEther(await wban.balanceOf(user1.address))} wBAN`);
	});

});
