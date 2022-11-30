import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Benis, WBANToken, ERC20, UniswapV2Factory, UniswapV2Pair } from "../artifacts/typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Signature } from "ethers";
import ReceiptsUtil from "./ReceiptsUtil";
import { increaseTo } from "./time";

chai.use(solidity);
const { expect } = chai;

describe('Benis', () => {
	let wban: WBANToken;
	let token1: ERC20;
	let token2: ERC20;
	let lpToken1: UniswapV2Pair;
	let lpToken2: UniswapV2Pair;
	let wbanRewards: BigNumber;
	let benis: Benis;
	let rewardsStartTime: number;
	let owner: SignerWithAddress;
	let rewarder: SignerWithAddress;
	let user1: SignerWithAddress;
	let user2: SignerWithAddress;
	const ONE_WEEK = BigNumber.from(7 * 24 * 60 * 60);

  beforeEach(async () => {
		const signers = await ethers.getSigners();
		[owner, rewarder, user1, user2] = signers;

		// deploy wBAN contract
		const wBANTokenFactory = await ethers.getContractFactory(
      "WBANToken",
      signers[0]
    );
		wban = (await upgrades.deployProxy(wBANTokenFactory)) as WBANToken;
		await wban.deployed();
		expect(wban.address).to.properAddress;

		// deploy fake tokens
		const MockERC20 = await ethers.getContractFactory("@uniswap/v2-core/contracts/test/ERC20.sol:ERC20", signers[0]);
		const MINTED_ERC20 = ethers.utils.parseEther("100");
		token1 = (await MockERC20.deploy(MINTED_ERC20)) as ERC20;
		await token1.deployed();
		expect(token1.address).to.properAddress;
		token2 = (await MockERC20.deploy(MINTED_ERC20)) as ERC20;
		await token2.deployed();
		expect(token2.address).to.properAddress;

		const UniswapFactory = await ethers.getContractFactory("UniswapV2Factory", signers[0]);
		const uniswapFactory = (await UniswapFactory.deploy("0x0000000000000000000000000000000000000000")) as UniswapV2Factory; // no fees
		await uniswapFactory.deployed();
		expect(uniswapFactory.address).to.properAddress;

		// deploy fake wBAN-TOK1 pair
		await uniswapFactory.createPair(token1.address, wban.address);
		const pair1 = await uniswapFactory.getPair(wban.address, token1.address);
		lpToken1 = await ethers.getContractAt("UniswapV2Pair", pair1, signers[0]) as UniswapV2Pair;
		// deploy fake wBAN-TOK2 pair
		await uniswapFactory.createPair(token2.address, wban.address);
		const pair2 = await uniswapFactory.getPair(wban.address, token2.address);
		lpToken2 = await ethers.getContractAt("UniswapV2Pair", pair2, signers[0]) as UniswapV2Pair;

		// deploy `Benis` contract
		const Benis = await ethers.getContractFactory("Benis", signers[0]);
		const rewardsPerSecond = ethers.utils.parseEther("1");
		rewardsStartTime = (await ethers.provider.getBlock('latest')).timestamp + 24 * 60 * 60;
		benis = await Benis.deploy(wban.address, rewardsPerSecond, rewardsStartTime) as Benis;
		await benis.deployed();
		expect(benis.address).to.properAddress;

		// mint some wBAN rewards
		wbanRewards = rewardsPerSecond.mul(ONE_WEEK);
		const uuid = BigNumber.from(await owner.getTransactionCount());
		const sig: Signature = await ReceiptsUtil.createReceipt(owner, rewarder.address, wbanRewards, uuid, await owner.getChainId());
		await expect(wban.connect(rewarder).mintWithReceipt(rewarder.address, wbanRewards, uuid, sig.v, sig.r, sig.s))
			.to.emit(wban, 'Transfer')
			.withArgs("0x0000000000000000000000000000000000000000", rewarder.address, wbanRewards);
		// send them to the rewards contract
		expect(await wban.balanceOf(rewarder.address)).to.equal(wbanRewards);
		await wban.connect(rewarder).transfer(benis.address, wbanRewards);
		expect(await wban.balanceOf(benis.address)).to.equal(wbanRewards);

		// extend deadline
		await benis.changeEndTime(ONE_WEEK);
		expect(await benis.endTime()).to.equal(ONE_WEEK.add(rewardsStartTime));
	});

	it('Single user whole farm duration', async () => {
		// create farm pool
		await benis.add(1_000, lpToken1.address, true);
		expect(await benis.poolLength()).to.equal(1);

		await createAndStakeLiquidity(user1);

		// jump to farm start time
		await increaseTo(rewardsStartTime);
		// harvest should not give any reward yet
		expect(await wban.balanceOf(user1.address)).to.equal(0);

		// unstake liquidity one week later
		await increaseTo(rewardsStartTime + 7 * 24 * 60 * 60 + 10_000);
		expect(await wban.balanceOf(user1.address)).to.equal(0);
		expect(await wban.balanceOf(benis.address)).to.equal(wbanRewards);

		expect(await benis.pendingWBAN(0, user1.address)).to.be.above(0);

		let userInfo = await benis.userInfo(0, user1.address);
		await benis.connect(user1).withdraw(0, userInfo.amount);
		expect(await wban.balanceOf(user1.address)).to.be.closeTo(wbanRewards, ethers.utils.parseEther("0.0000000001"));
		userInfo = await benis.userInfo(0, user1.address);
		expect(userInfo.remainingWBANReward).to.equal(0);
	});

	it('Change of rewards rate', async () => {
		// create farm pool
		await benis.add(1_000, lpToken1.address, true);
		expect(await benis.poolLength()).to.equal(1);

		await createAndStakeLiquidity(user1);

		// jump to farm start time
		await increaseTo(rewardsStartTime);
		// harvest should not give any reward yet
		expect(await wban.balanceOf(user1.address)).to.equal(0);

		// half a week later, divide rewards rate by 2
		await increaseTo(rewardsStartTime + 7 * 24 * 60 * 60 / 2);
		const wbanPerSecond = await benis.wbanPerSecond();
		await benis.setWBANPerSecond(wbanPerSecond.div(2), true);

		// unstake liquidity one week later
		await increaseTo(rewardsStartTime + 7 * 24 * 60 * 60 + 10_000);
		expect(await wban.balanceOf(user1.address)).to.equal(0);
		expect(await wban.balanceOf(benis.address)).to.equal(wbanRewards);

		expect(await benis.pendingWBAN(0, user1.address)).to.be.above(0);

		let userInfo = await benis.userInfo(0, user1.address);
		await benis.connect(user1).withdraw(0, userInfo.amount);
		expect(await wban.balanceOf(user1.address)).to.be.closeTo(wbanRewards.mul(3).div(4), ethers.utils.parseEther("0.5"));
	});

	it('Two users 50%/50% whole farm duration', async () => {
		// create farm pool
		await benis.add(1_000, lpToken1.address, true);
		expect(await benis.poolLength()).to.equal(1);

		await createAndStakeLiquidity(user1);
		await createAndStakeLiquidity(user2);

		// jump to farm start time
		await increaseTo(rewardsStartTime);
		// harvest should not give any reward yet
		for (let user of [user1, user2]) {
			expect(await wban.balanceOf(user.address)).to.equal(0);
		}

		// unstake liquidity one week later
		await increaseTo(rewardsStartTime + 7 * 24 * 60 * 60 + 10_000);
		expect(await wban.balanceOf(benis.address)).to.equal(wbanRewards);

		for (let user of [user1, user2]) {
			expect(await wban.balanceOf(user.address)).to.equal(0);
			expect(await benis.pendingWBAN(0, user.address)).to.be.above(0);

			const userInfo = await benis.userInfo(0, user.address);
			await benis.connect(user).withdraw(0, userInfo.amount);
			expect(await wban.balanceOf(user.address)).to.be.closeTo(wbanRewards.div(2), ethers.utils.parseEther("0.0000000001"));
		}
	});

	it('Two users 25%/75% whole farm duration', async () => {
		// create farm pool
		await benis.add(1_000, lpToken1.address, true);
		expect(await benis.poolLength()).to.equal(1);

		await createAndStakeLiquidity(user1, 0, ethers.utils.parseEther("25"), ethers.utils.parseEther("25"));
		await createAndStakeLiquidity(user2, 0, ethers.utils.parseEther("75"), ethers.utils.parseEther("75"));

		// jump to farm start time
		await increaseTo(rewardsStartTime);
		// harvest should not give any reward yet
		for (let user of [user1, user2]) {
			expect(await wban.balanceOf(user.address)).to.equal(0);
		}

		// unstake liquidity one week later
		await increaseTo(rewardsStartTime + 7 * 24 * 60 * 60 + 10_000);
		expect(await wban.balanceOf(benis.address)).to.equal(wbanRewards);
		for (let user of [user1, user2]) {
			expect(await wban.balanceOf(user.address)).to.equal(0);
			expect(await benis.pendingWBAN(0, user.address)).to.be.above(0);
			const userInfo = await benis.userInfo(0, user.address);
			await benis.connect(user).withdraw(0, userInfo.amount);
		}

		// check expected rewards
		expect(await wban.balanceOf(user1.address)).to.be.closeTo(wbanRewards.div(4), ethers.utils.parseEther("0.0000000001"));
		expect(await wban.balanceOf(user2.address)).to.be.closeTo(wbanRewards.mul(3).div(4), ethers.utils.parseEther("0.0000000001"));
	});

	it('Two users 50%/50% half farm duration, user1 doubles his staked liquidity afterwards', async () => {
		// create farm pool
		await benis.add(1_000, lpToken1.address, true);
		expect(await benis.poolLength()).to.equal(1);

		await createAndStakeLiquidity(user1);
		await createAndStakeLiquidity(user2);

		// jump to farm start time
		await increaseTo(rewardsStartTime);

		// user1 doubles his staked LP half a week later
		await increaseTo(rewardsStartTime + (7 * 24 * 60 * 60) / 2);
		await createAndStakeLiquidity(user1);

		// unstake liquidity one week later
		await increaseTo(rewardsStartTime + 7 * 24 * 60 * 60 + 10_000);
		for (let user of [user1, user2]) {
			const userInfo = await benis.userInfo(0, user.address);
			await benis.connect(user).withdraw(0, userInfo.amount);
		}

		// check users rewards -- allow 3% delta due to unprecise timings
		expect(await wban.balanceOf(user1.address)).to.be.closeTo(wbanRewards.mul(60).div(100), wbanRewards.mul(3).div(100));
		expect(await wban.balanceOf(user2.address)).to.be.closeTo(wbanRewards.mul(40).div(100), wbanRewards.mul(3).div(100));
	});

	it('Two users 100%/50% farm durations', async () => {
		// create farm pool
		await benis.add(1_000, lpToken1.address, true);
		expect(await benis.poolLength()).to.equal(1);

		// user1 joins the farm at start
		await createAndStakeLiquidity(user1);

		// jump to farm start time
		await increaseTo(rewardsStartTime);

		// user2 joins the farm half a week later
		await increaseTo(rewardsStartTime + (7 * 24 * 60 * 60) / 2);
		await createAndStakeLiquidity(user2);

		// jump after end of farm
		await increaseTo(rewardsStartTime + 7 * 24 * 60 * 60 + 10_000);

		// all users withdraw and harvest
		for (let user of [user1, user2]) {
			expect(await wban.balanceOf(user.address)).to.equal(0);
			expect(await benis.pendingWBAN(0, user.address)).to.be.above(0);

			const userInfo = await benis.userInfo(0, user.address);
			await benis.connect(user).withdraw(0, userInfo.amount);
		}

		// check user rewards
		expect(await wban.balanceOf(user1.address)).to.be.closeTo(wbanRewards.mul(3).div(4), ethers.utils.parseEther("3.6"));
		expect(await wban.balanceOf(user2.address)).to.be.closeTo(wbanRewards.div(4), ethers.utils.parseEther("3.6"));
	});

	it('Two farms 1000/1000 alloc points, users whole farm duration', async () => {
		// create farm pools
		await benis.add(1_000, lpToken1.address, true);
		await benis.add(1_000, lpToken2.address, true);
		expect(await benis.poolLength()).to.equal(2);

		await createAndStakeLiquidity(user1, 0);
		await createAndStakeLiquidity(user2, 1);

		// jump to farm start time
		await increaseTo(rewardsStartTime);
		// harvest should not give any reward yet
		for (let user of [user1, user2]) {
			expect(await wban.balanceOf(user.address)).to.equal(0);
		}

		// unstake liquidity one week later
		await increaseTo(rewardsStartTime + 7 * 24 * 60 * 60 + 10_000);
		expect(await wban.balanceOf(benis.address)).to.equal(wbanRewards);

		// check users rewards
		const userInfo1 = await benis.userInfo(0, user1.address);
		const userInfo2 = await benis.userInfo(1, user2.address);
		await benis.connect(user1).withdraw(0, userInfo1.amount);
		await benis.connect(user2).withdraw(1, userInfo2.amount);
		expect(await wban.balanceOf(user1.address)).to.be.closeTo(wbanRewards.div(2), ethers.utils.parseEther("0.0000000001"));
		expect(await wban.balanceOf(user2.address)).to.be.closeTo(wbanRewards.div(2), ethers.utils.parseEther("0.0000000001"));
	});

	it('Two farms 1000/500 alloc points, users whole farm duration', async () => {
		// create farm pools
		await benis.add(1_000, lpToken1.address, true);
		await benis.add(1_000, lpToken2.address, false);
		await benis.set(1, 500, true);
		expect(await benis.poolLength()).to.equal(2);
		expect((await benis.poolInfo(0)).allocPoint).to.equal(1_000);
		expect((await benis.poolInfo(1)).allocPoint).to.equal(500);

		await createAndStakeLiquidity(user1, 0);
		await createAndStakeLiquidity(user2, 1);

		// jump to farm start time
		await increaseTo(rewardsStartTime);
		// harvest should not give any reward yet
		for (let user of [user1, user2]) {
			expect(await wban.balanceOf(user.address)).to.equal(0);
		}

		// unstake liquidity one week later
		await increaseTo(rewardsStartTime + 7 * 24 * 60 * 60 + 10_000);
		expect(await wban.balanceOf(benis.address)).to.equal(wbanRewards);

		// check users rewards
		const userInfo1 = await benis.userInfo(0, user1.address);
		const userInfo2 = await benis.userInfo(1, user2.address);
		await benis.connect(user1).withdraw(0, userInfo1.amount);
		await benis.connect(user2).withdraw(1, userInfo2.amount);
		expect(await wban.balanceOf(user1.address)).to.be.closeTo(wbanRewards.mul(2).div(3), ethers.utils.parseEther("0.0000000001"));
		expect(await wban.balanceOf(user2.address)).to.be.closeTo(wbanRewards.div(3), ethers.utils.parseEther("0.0000000001"));
	});

	it('Emergency withdraw', async () => {
		// create farm pool
		await benis.add(1_000, lpToken1.address, true);
		expect(await benis.poolLength()).to.equal(1);

		await createAndStakeLiquidity(user1);

		// jump to farm start time
		await increaseTo(rewardsStartTime);
		// harvest should not give any reward yet
		expect(await wban.balanceOf(user1.address)).to.equal(0);

		// emergency withdraw one week later
		await increaseTo(rewardsStartTime + 7 * 24 * 60 * 60 + 10_000);
		expect(await wban.balanceOf(user1.address)).to.equal(0);
		expect(await wban.balanceOf(benis.address)).to.equal(wbanRewards);
		expect(await benis.pendingWBAN(0, user1.address)).to.be.above(0);
		const liquidity = (await benis.userInfo(0, user1.address)).amount;
		await benis.connect(user1).emergencyWithdraw(0);
		expect(await lpToken1.balanceOf(user1.address)).to.equal(liquidity);
		expect(await wban.balanceOf(user1.address)).to.equal(0);
	});

	it('Keep track of rewards debt', async () => {
		// create farm pool
		await benis.add(1_000, lpToken1.address, true);
		expect(await benis.poolLength()).to.equal(1);

		await createAndStakeLiquidity(user1);

		// extend duration for an extra week with not enough wBAN rewards sent to Benis
		await benis.changeEndTime(ONE_WEEK);

		// unstake liquidity two week later, with one week worth of rewards missing
		await increaseTo(rewardsStartTime + 2 * 7 * 24 * 60 * 60 + 10_000);
		expect(await wban.balanceOf(user1.address)).to.equal(0);
		expect(await wban.balanceOf(benis.address)).to.equal(wbanRewards);
		let userInfo = await benis.userInfo(0, user1.address);
		await benis.connect(user1).withdraw(0, userInfo.amount);
		expect(await wban.balanceOf(user1.address)).to.be.closeTo(wbanRewards, ethers.utils.parseEther("0.0000000001"));
		userInfo = await benis.userInfo(0, user1.address);
		expect(userInfo.remainingWBANReward).to.be.above(0);

		// send some more wBAN rewards to Benis
		const uuid = BigNumber.from(await owner.getTransactionCount());
		const sig = await ReceiptsUtil.createReceipt(owner, rewarder.address, wbanRewards, uuid, await owner.getChainId());
		await wban.connect(rewarder).mintWithReceipt(rewarder.address, wbanRewards, uuid, sig.v, sig.r, sig.s);
		// send them to the rewards contract
		expect(await wban.balanceOf(benis.address)).to.equal(0);
		await wban.connect(rewarder).transfer(benis.address, wbanRewards);
		expect(await wban.balanceOf(benis.address)).to.equal(wbanRewards);
		// user withdraws again zero liquidity and gets back missing previous rewards
		await benis.connect(user1).withdraw(0, 0);
		expect(await wban.balanceOf(user1.address)).to.be.closeTo(wbanRewards.mul(2), ethers.utils.parseEther("0.0000000001"));
		userInfo = await benis.userInfo(0, user1.address);
		expect(userInfo.remainingWBANReward).to.equal(0);
	});

	async function createAndStakeLiquidity(
		user: SignerWithAddress,
		pid = 0,
		wbanToMint = ethers.utils.parseEther("10000"),
		tokenToMint = ethers.utils.parseEther("0.7936")
	) {
		// mint some wBAN for users
		const uuid = BigNumber.from(await user.getTransactionCount());
		const sig: Signature = await ReceiptsUtil.createReceipt(owner, user.address, wbanToMint, uuid, await user.getChainId());
		await expect(wban.connect(user).mintWithReceipt(user.address, wbanToMint, uuid, sig.v, sig.r, sig.s))
			.to.emit(wban, 'Transfer')
			.withArgs(ethers.constants.AddressZero, user.address, wbanToMint);
		expect(await wban.balanceOf(user.address)).to.equal(wbanToMint);

		// mint some fake token
		const token = pid === 0 ? token1 : token2;
		await token.transfer(user.address, tokenToMint);
		expect(await token.balanceOf(user.address)).to.equal(tokenToMint);

		// provide liquidity
		const lpToken = pid === 0 ? lpToken1 : lpToken2;
		await wban.connect(user).transfer(lpToken.address, wbanToMint);
		await token.connect(user).transfer(lpToken.address, tokenToMint);
		await lpToken.connect(user).mint(user.address);
		const liquidity: BigNumber = await lpToken.balanceOf(user.address);
		expect(liquidity.gt(BigNumber.from(0)));

		// stake liquidity before the farm started
		await lpToken.connect(user).approve(benis.address, liquidity);
		await benis.connect(user).deposit(pid, liquidity);
		//expect(await wban.balanceOf(user.address)).to.equal(0);
	}

});
