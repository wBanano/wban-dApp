import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { WBANToken } from '../artifacts/typechain/WBANToken';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Signature } from "ethers";
import ReceiptsUtil from "./ReceiptsUtil";

chai.use(solidity);
const { expect } = chai;

describe('WBANToken', () => {
	let token: WBANToken;
	let owner: SignerWithAddress;
	let user1: SignerWithAddress;
	let user2: SignerWithAddress;

  beforeEach(async () => {
		[owner, user1, user2] = await ethers.getSigners();

		const wBANTokenFactory = await ethers.getContractFactory(
      "WBANToken",
      owner
    );
		token = (await upgrades.deployProxy(wBANTokenFactory)) as WBANToken;
		await token.deployed();

		expect(token.address).to.properAddress;
	});

	describe('Wrap', () => {

		it('Refuses to mint if the parameters do not match the receipt', async () => {
			const wBanToMint = ethers.utils.parseEther("123");
			const user1_interaction = token.connect(user1);
			const uuid = BigNumber.from(await user1.getTransactionCount());

			const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());

			await expect(user1_interaction.mintWithReceipt(user1.address, ethers.utils.parseEther("1"), uuid, sig.v, sig.r, sig.s))
				.to.be.revertedWith("Signature invalid");
			await expect(user1_interaction.mintWithReceipt(owner.address, wBanToMint, uuid, sig.v, sig.r, sig.s))
				.to.be.revertedWith("Signature invalid");
			await expect(user1_interaction.mintWithReceipt(user1.address, wBanToMint, BigNumber.from(12345678), sig.v, sig.r, sig.s))
				.to.be.revertedWith("Signature invalid");
		});

		it('Refuses to mint if the amount and uuid parameters are swapped', async () => {
			const user1_interaction = token.connect(user1);
			const wBanToMint = ethers.utils.parseEther("123");
			const uuid = ethers.utils.parseEther("456");

			const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());
			await expect(user1_interaction.mintWithReceipt(user1.address, uuid, wBanToMint, sig.v, sig.r, sig.s))
				.to.be.revertedWith("Signature invalid");
		});

		it('Refuses to mint if the receipt was not signed by the owner', async () => {
			const wBanToMint = ethers.utils.parseEther("123");
			const user1_interaction = token.connect(user1);
			const uuid = BigNumber.from(await user1.getTransactionCount());

			const sig: Signature = await ReceiptsUtil.createReceipt(user1, user1.address, wBanToMint, uuid, await owner.getChainId());

			await expect(user1_interaction.mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s))
				.to.be.revertedWith("Signature invalid");
		});

		it('Refuses to mint if the smart-contract is paused', async () => {
			const wBanToMint = ethers.utils.parseEther("123");
			const user1_interaction = token.connect(user1);
			const uuid = BigNumber.from(await user1.getTransactionCount());

			await token.pause();

			const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());
			await expect(user1_interaction.mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s))
				.to.be.revertedWith("BEP20Pausable: transfer paused");
		});

		it('Refuses to mint if using wrong chain ID', async () => {
			const wBanToMint = ethers.utils.parseEther("123");
			const user1_interaction = token.connect(user1);
			const uuid = BigNumber.from(await user1.getTransactionCount());

			const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, 98765);
			await expect(user1_interaction.mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s))
				.to.be.revertedWith("Signature invalid");
		});

		it('Mints wBAN if the receipt matches parameters', async () => {
			const wBanToMint = ethers.utils.parseEther("123");
			const user1_interaction = token.connect(user1);
			const uuid = BigNumber.from(await user1.getTransactionCount());

			const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());
			await expect(user1_interaction.mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s))
				.to.emit(token, 'Transfer')
				.withArgs("0x0000000000000000000000000000000000000000", user1.address, wBanToMint);

			// make sure user was sent his wBAN
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);
			// make sure total supply was changed
			expect(await token.totalSupply()).to.equal(wBanToMint);
			// make sure the associated receipt is consumed
			expect(await token.isReceiptConsumed(user1.address, wBanToMint, uuid)).to.be.true;
		});

	});

	describe('Unwrap', () => {

		it('Refuses to swap if user has NOT enough wBAN', async () => {
			// mint some wBAN, first
			const wBanToMint = ethers.utils.parseEther("123");
			const user1_interaction = token.connect(user1);
			const uuid = BigNumber.from(await user1.getTransactionCount());

			const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());
			await expect(user1_interaction.mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s))
				.to.emit(token, 'Transfer')
				.withArgs("0x0000000000000000000000000000000000000000", user1.address, wBanToMint);
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);

			// now ask to swap back to BAN
			await expect(user1_interaction.swapToBan("ban_1o3k8868n6d1679iz6fcz1wwwaq9hek4ykd58wsj5bozb8gkf38pm7njrr1o", ethers.utils.parseEther("300")))
				.to.be.revertedWith("Insufficient wBAN");
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);
		});

		it('Refuses to swap if Banano address is invalid', async () => {
			// mint some wBAN, first
			const wBanToMint = ethers.utils.parseEther("123");
			const user1_interaction = token.connect(user1);
			const uuid = BigNumber.from(await user1.getTransactionCount());

			const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());
			await expect(user1_interaction.mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s))
				.to.emit(token, 'Transfer')
				.withArgs("0x0000000000000000000000000000000000000000", user1.address, wBanToMint);
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);

			// now ask to swap back to BAN
			await expect(user1_interaction.swapToBan("ban_whatever_wrong", wBanToMint))
				.to.be.revertedWith("Not a Banano address");
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);
		});

		it('Swaps if user has enough wBAN', async () => {
			// mint some wBAN, first
			const wBanToMint = ethers.utils.parseEther("123");
			const user1_interaction = token.connect(user1);
			const uuid = BigNumber.from(await user1.getTransactionCount());

			const sig: Signature = await ReceiptsUtil.createReceipt(owner, user1.address, wBanToMint, uuid, await owner.getChainId());
			await expect(user1_interaction.mintWithReceipt(user1.address, wBanToMint, uuid, sig.v, sig.r, sig.s))
				.to.emit(token, 'Transfer')
				.withArgs("0x0000000000000000000000000000000000000000", user1.address, wBanToMint);
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);

			// now ask to swap back to BAN
			await expect(user1_interaction.swapToBan("ban_1o3k8868n6d1679iz6fcz1wwwaq9hek4ykd58wsj5bozb8gkf38pm7njrr1o", wBanToMint))
				.to.emit(token, 'Transfer').withArgs(user1.address, '0x0000000000000000000000000000000000000000', wBanToMint)
				.to.emit(token, 'SwapToBan').withArgs(user1.address, "ban_1o3k8868n6d1679iz6fcz1wwwaq9hek4ykd58wsj5bozb8gkf38pm7njrr1o", wBanToMint);
			expect(await token.balanceOf(user1.address)).to.equal(0);
		});

	});

});
