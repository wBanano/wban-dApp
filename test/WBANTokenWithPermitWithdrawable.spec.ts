import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { WBANToken, WBANTokenWithPermit, WBANTokenWithPermitWithdrawable, MockBEP20 } from '../artifacts/typechain';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Signature } from "ethers";
import ReceiptsUtil from "./ReceiptsUtil";

chai.use(solidity);
const { expect } = chai;

describe('WBANTokenWithPermitWithdrawable', () => {
	let token: WBANTokenWithPermit;
	let owner: SignerWithAddress;
	let withdrawer: SignerWithAddress;
	let user1: SignerWithAddress;
	let user2: SignerWithAddress;

  beforeEach(async () => {
		[owner, withdrawer, user1, user2] = await ethers.getSigners();
	});

	it('Upgrades from WBANTokenWithPermit contract', async () => {
		// deploy WBANToken
		const wBANTokenFactory = await ethers.getContractFactory(
      "WBANToken",
      owner
    );
		const oldToken = (await upgrades.deployProxy(wBANTokenFactory)) as WBANToken;
		await oldToken.deployed();
		expect(oldToken.address).to.have.properAddress;

		// mints some tokens for user
		const wBanToMint = ethers.utils.parseEther("123");
		const uuid = BigNumber.from(await user1.getTransactionCount());
		const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());
		await oldToken.connect(user1).mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s);
		expect(await oldToken.balanceOf(user1.address)).to.equal(wBanToMint);

		// approve user2 to spend some tokens
		await oldToken.connect(user1).approve(user2.address, wBanToMint);
		expect(await oldToken.allowance(user1.address, user2.address)).to.equal(wBanToMint);

		// upgrade to WBANTokenWithPermit
		const wBANTokenFactoryWithPermit = await ethers.getContractFactory("WBANTokenWithPermit", owner);
		const token = await upgrades.upgradeProxy(oldToken.address, wBANTokenFactoryWithPermit, { call: "initializeWithPermit" }) as WBANTokenWithPermit;

		// upgrade to WBANTokenWithPermitWithdrawable
		const wBANTokenFactoryWithPermitWithdrawable = await ethers.getContractFactory("WBANTokenWithPermitWithdrawable", owner);
		const newToken = await upgrades.upgradeProxy(oldToken.address, wBANTokenFactoryWithPermitWithdrawable) as WBANTokenWithPermitWithdrawable;

		// user2 still has the same balance & allowance
		expect(await newToken.balanceOf(user1.address)).to.equal(wBanToMint);
		expect(await newToken.allowance(user1.address, user2.address)).to.equal(wBanToMint);
	});

	it('Can retreive tokens wrongfully sent to wBAN contract', async () => {
		// deploy wBAN
		const wBANTokenFactory = await ethers.getContractFactory(
      "WBANTokenWithPermitWithdrawable",
      owner
    );
		const wban = (await upgrades.deployProxy(wBANTokenFactory)) as WBANTokenWithPermitWithdrawable;
		await wban.deployed();

		// grant WITHDRAWER_ROLE to withdrawer user
		const WITHDRAWER_ROLE = await wban.WITHDRAWER_ROLE();
		await wban.grantRole(WITHDRAWER_ROLE, withdrawer.address);

		// mint fake tokens to user1
		const MINTED_AMOUNT = ethers.utils.parseEther("19");
		const MockBEP20 = await ethers.getContractFactory("MockBEP20", owner);
		const MINTED_ERC20 = ethers.utils.parseEther("100");
		const token1 = (await MockBEP20.deploy("Token 1", "TOK1", MINTED_ERC20)) as MockBEP20;
		await token1.deployed();
		const token2 = (await MockBEP20.deploy("Token 2", "TOK2", MINTED_ERC20)) as MockBEP20;
		await token2.deployed();
		await token1.mint(MINTED_AMOUNT);
		await token2.mint(MINTED_AMOUNT);
		await token1.transfer(user1.address, MINTED_AMOUNT);
		await token2.transfer(user1.address, MINTED_AMOUNT);

		// user send some token1 and token2 to wBAN
		await token1.connect(user1).transfer(wban.address, MINTED_AMOUNT);
		expect(await token1.balanceOf(wban.address)).to.equal(MINTED_AMOUNT);
		await token2.connect(user1).transfer(wban.address, MINTED_AMOUNT);
		expect(await token2.balanceOf(wban.address)).to.equal(MINTED_AMOUNT);

		// wrong users try to retreive token1
		await expect(wban.connect(owner).withdrawUnexpectedTokens(token1.address))
			.to.be.revertedWith(`AccessControl: account ${owner.address.toLowerCase()} is missing role ${WITHDRAWER_ROLE}`);
		await expect(wban.connect(user2).withdrawUnexpectedTokens(token1.address))
			.to.be.revertedWith(`AccessControl: account ${user2.address.toLowerCase()} is missing role ${WITHDRAWER_ROLE}`);

		// withdrawer retrieves token1
		expect(await wban.connect(withdrawer).withdrawUnexpectedTokens(token1.address))
			.to.emit(wban, 'WithdrawLockedTokens').withArgs(withdrawer.address, token1.address, MINTED_AMOUNT);
		expect(await token1.balanceOf(withdrawer.address)).to.equal(MINTED_AMOUNT);

		// wBAN should still have some token2
		expect(await token2.balanceOf(wban.address)).to.equal(MINTED_AMOUNT);

		// withdrawer retrieves token2
		expect(await wban.connect(withdrawer).withdrawUnexpectedTokens(token2.address))
			.to.emit(wban, 'WithdrawLockedTokens').withArgs(withdrawer.address, token2.address, MINTED_AMOUNT);
		expect(await token2.balanceOf(withdrawer.address)).to.equal(MINTED_AMOUNT);
	})

});
