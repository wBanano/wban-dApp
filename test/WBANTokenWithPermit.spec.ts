import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { WBANToken, WBANTokenWithPermit, WBANTokenWithPermit__factory } from '../artifacts/typechain';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Signature } from "ethers";
import ReceiptsUtil from "./ReceiptsUtil";
import PermitUtil from "./PermitUtil";

chai.use(solidity);
const { expect } = chai;

describe('WBANToken', () => {
	let token: WBANTokenWithPermit;
	let owner: SignerWithAddress;
	let user1: SignerWithAddress;
	let user2: SignerWithAddress;

  beforeEach(async () => {
		[owner, user1, user2] = await ethers.getSigners();
	});

	it('Upgrades from WBANToken contract', async () => {
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

		// upgrade to WBANTokenFactory
		const wBANTokenFactoryWithPermit = await ethers.getContractFactory("WBANTokenWithPermit", owner);
		const token = await upgrades.upgradeProxy(oldToken.address, wBANTokenFactoryWithPermit, { call: "initializeWithPermit" }) as WBANTokenWithPermit;

		// user2 still has the same balance & allowance
		expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);
		expect(await token.allowance(user1.address, user2.address)).to.equal(wBanToMint);
	});

	it('Changes approval using permit', async () => {
		// deploy WBANToken
		const wBANTokenFactory = await ethers.getContractFactory(
      "WBANToken",
      owner
    );
		const oldToken = (await upgrades.deployProxy(wBANTokenFactory)) as WBANToken;
		await oldToken.deployed();
		expect(oldToken.address).to.have.properAddress;

		// upgrade to WBANTokenFactory
		const wBANTokenFactoryWithPermit = await ethers.getContractFactory("WBANTokenWithPermit", owner);
		const token = await upgrades.upgradeProxy(oldToken.address, wBANTokenFactoryWithPermit, { call: "initializeWithPermit" }) as WBANTokenWithPermit;

		// mint some wBAN for user1
		const wBanToMint = ethers.utils.parseEther("123");
		const uuid = BigNumber.from(await user1.getTransactionCount());
		const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());
		await token.connect(user1).mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s);
		// make sure user was sent his wBAN
		expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);

		// user1 gives allowance to user2
		const allowance = wBanToMint.div(2);
		const nonceUser1 = await token.nonces(user1.address);
		const deadline = Date.now();
		const permitSig: Signature = await PermitUtil.createPermitSignature(token, user1, user2.address, allowance, nonceUser1, deadline, await user1.getChainId());

		// admin calls the permit function allowing user2 to spend user1 wBAN
		expect(await token.permit(user1.address, user2.address, allowance, deadline, permitSig.v, permitSig.r, permitSig.s));
		// check expected allowance for user1 to user2
		expect(await token.allowance(user1.address, user2.address)).to.equal(allowance);
	});

});
