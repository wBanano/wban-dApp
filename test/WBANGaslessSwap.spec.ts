import { ethers, waffle, upgrades } from "hardhat";
import chai from "chai";
import { WBANGaslessSwap, WBANTokenWithPermit, FakeZeroEx } from '../artifacts/typechain';
import { MockProvider } from "ethereum-waffle";
import { BigNumber, PopulatedTransaction, Signature, Wallet } from "ethers";
import ReceiptsUtil from "./ReceiptsUtil";
import PermitUtil from "./PermitUtil";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const { expect } = chai;
const { loadFixture, solidity } = waffle;
chai.use(solidity);

describe('WBANGaslessSwap', () => {

	async function fixture(wallets: Wallet[], provider: MockProvider):
		Promise<{
			swap: WBANGaslessSwap,
			zeroEx: FakeZeroEx,
			wban: WBANTokenWithPermit,
			owner: SignerWithAddress,
			relayer: SignerWithAddress,
			user1: SignerWithAddress,
			user2: SignerWithAddress,
		}>
	{
		const [owner, relayer, user1, user2] = await ethers.getSigners();

		// deploy WBANToken
		const wBANTokenFactory = await ethers.getContractFactory("WBANToken", owner);
		let wban = (await upgrades.deployProxy(wBANTokenFactory)) as WBANTokenWithPermit;
		await wban.deployed();
		const wBANTokenFactoryWithPermit = await ethers.getContractFactory("WBANTokenWithPermit", owner);
		wban = await upgrades.upgradeProxy(wban.address, wBANTokenFactoryWithPermit, { call: "initializeWithPermit" }) as WBANTokenWithPermit;

		// create 0x fake contract
		const FakeZeroEx = await ethers.getContractFactory("FakeZeroEx");
		const zeroEx: FakeZeroEx = await FakeZeroEx.deploy();
		await zeroEx.deployed();

		// deploy WBANGaslessSwap
		const gaslessSwapFactory = await ethers.getContractFactory(
      "WBANGaslessSwap",
      owner
    );
		const swap = (await upgrades.deployProxy(gaslessSwapFactory, [wban.address, zeroEx.address])) as WBANGaslessSwap;
		await swap.deployed();
		await swap.grantRole(await swap.MINTER_ROLE(), relayer.address);

		// fund 0x fake contract
		await owner.sendTransaction({ to: zeroEx.address, value: ethers.utils.parseEther("1.0") });

		return { swap, zeroEx, wban, owner, relayer, user1, user2 };
	}

	it('Does a gasless swap from wBAN to ETH', async () => {
		const { swap, zeroEx, wban, owner, relayer, user1 } = await loadFixture(fixture);

		// mint some wBAN for user1
		const wBanToMint = ethers.utils.parseEther("123");
		const uuid = BigNumber.from(await user1.getTransactionCount());
		const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());
		await wban.connect(relayer).mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s);

		// user1 gives allowance to gasless swap contract
		const allowance = wBanToMint;
		const nonceUser1 = await wban.nonces(user1.address);
		const deadline = Date.now() + 30_000;
		const permitSig: Signature = await PermitUtil.createPermitSignature(wban, user1, swap.address, allowance, nonceUser1, deadline, await user1.getChainId());

		const tx: PopulatedTransaction = await zeroEx.populateTransaction.fakeSwap(ethers.utils.parseEther("0.19"));
		const data = tx.data!;

		// relay user1 request for a gasless swap
		await expect(await swap
			.connect(relayer)
			.swapWBANToCrypto(
				user1.address,
				allowance,
				deadline,
				permitSig.v,
				permitSig.r,
				permitSig.s,
				data
			))
			.to.changeEtherBalance(user1, ethers.utils.parseEther("0.19"));
	});

	it('Refuses a gasless swap from wBAN to another ERC20', async () => {
		const { swap, zeroEx, wban, owner, relayer, user1 } = await loadFixture(fixture);

		// mint some wBAN for user1
		const wBanToMint = ethers.utils.parseEther("123");
		const uuid = BigNumber.from(await user1.getTransactionCount());
		const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());
		await wban.connect(relayer).mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s);

		// user1 gives allowance to gasless swap contract
		const allowance = wBanToMint;
		const nonceUser1 = await wban.nonces(user1.address);
		const deadline = Date.now() + 30_000;
		const permitSig: Signature = await PermitUtil.createPermitSignature(wban, user1, swap.address, allowance, nonceUser1, deadline, await user1.getChainId());

		// don't send any ETH
		const tx: PopulatedTransaction = await zeroEx.populateTransaction.fakeSwap(0);
		const data = tx.data!;

		// relay user1 request for a gasless swap
		await expect(swap
			.connect(relayer)
			.swapWBANToCrypto(
				user1.address,
				allowance,
				deadline,
				permitSig.v,
				permitSig.r,
				permitSig.s,
				data
			))
			.to.be.revertedWith("Invalid output token");
	});

});
