import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { WBANToken1 } from '../artifacts/typechain/WBANToken1';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

chai.use(solidity);
const { expect } = chai;

describe('WBANToken (old requiring user to deposit BNB)', () => {
	let token: WBANToken1;
	let owner: SignerWithAddress;
	let user1: SignerWithAddress;

  beforeEach(async () => {
		const signers = await ethers.getSigners();
		[owner, user1] = signers;

		const wBANTokenFactory = await ethers.getContractFactory(
      "WBANToken1",
      signers[0]
    );
		token = (await upgrades.deployProxy(wBANTokenFactory)) as WBANToken1;
		await token.deployed();

		expect(token.address).to.properAddress;
	});

	describe('BNB Deposits', () => {
		it('Keeps track of user deposits in BNB to cover owner fees', async () => {
			const user_deposit_amount = ethers.utils.parseEther('0.01');
			const user1_interaction = token.connect(user1);
			// make sure the BNB were received by the owner
			await expect(() => user1_interaction.bnbDeposit({ value: user_deposit_amount }))
				.to.changeEtherBalance(owner, user_deposit_amount);
			// make sure user deposits are registered
			expect(await token.bnbBalanceOf(user1.address)).to.equal(user_deposit_amount);
			// make sure that the BNBDeposit event was emitted
			await expect(user1_interaction.bnbDeposit({ value: user_deposit_amount }))
				.to.emit(token, 'BNBDeposit').withArgs(user1.address, user_deposit_amount);
		});
	});

	describe('Swaps: BAN -> wBAN', () => {

		/*
		it('Refuses to mint wBAN if user did not deposit enough BNB for owner fees', async () => {
			const wBanToMint = 123;
			// user did not deposit any BNB
			await expect(token.mintTo(user1.address, wBanToMint, 200_000, { gasLimit: 200_000 }))
				.to.be.revertedWith('Insufficient BNB deposited');
			// user did not deposit enough BNB
			const user1_interaction = token.connect(user1);
			await user1_interaction.bnbDeposit({ value: ethers.utils.parseEther('0.0001') });
			await expect(token.mintTo(user1.address, wBanToMint, 200_000, { gasLimit: 200_000 }))
				.to.be.revertedWith('Insufficient BNB deposited');
		});
		*/

		it('Refuses to mint if gas limit is zero', async () => {
			const wBanToMint = 123;
			const user1_interaction = token.connect(user1);
			await user1_interaction.bnbDeposit({ value: ethers.utils.parseEther('0.001') });
			await expect(token.mintTo(user1.address, wBanToMint, 0, { gasLimit: 200_000 }))
				.to.be.revertedWith("Gas limit can't be zero");
		});

		it('Refuses to mint if the caller is not the owner', async () => {
			const wBanToMint = 123;
			const gasPrice = 20_000_000_000;
			const user1_interaction = token.connect(user1);
			await expect(user1_interaction.mintTo(user1.address, wBanToMint, 200_000, { gasLimit: 200_000, gasPrice: gasPrice }))
				.to.be.revertedWith("Ownable: caller is not the owner");
		});

		it('Refuses to mint if the smart-contract is paused', async () => {
			const wBanToMint = 123;
			const gasPrice = 20_000_000_000;
			await token.pause();
			const user1_interaction = token.connect(user1);
			await user1_interaction.bnbDeposit({ value: ethers.utils.parseEther('0.01') });
			await expect(token.mintTo(user1.address, wBanToMint, 200_000, { gasLimit: 200_000, gasPrice: gasPrice }))
				.to.be.revertedWith("BEP20Pausable: transfer paused");
		});

		it('Mints wBAN if user deposited enough BNB', async () => {
			const wBanToMint = 123;
			const gasPrice = 20_000_000_000;
			const user1_interaction = token.connect(user1);
			await user1_interaction.bnbDeposit({ value: ethers.utils.parseEther('0.01') });
			// TODO: verify that the BNB balance of user1 is reduced due to gas costs from owner's transaction for mint
			await expect(token.mintTo(user1.address, wBanToMint, 200_000, { gasLimit: 200_000, gasPrice: gasPrice }))
				.to.emit(token, 'Fee').withArgs(user1.address, 200_000 * gasPrice);
			// make sure user was sent his wBAN
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);
			// make sure total supply was changed
			expect(await token.totalSupply()).to.equal(wBanToMint);
		});

	});

	describe('Swaps: wBAN -> BAN', () => {

		it('Refuses to swap if user has NOT enough wBAN', async () => {
			// mint some wBAN, first
			const wBanToMint = 123;
			const gasPrice = 20_000_000_000;
			const user1_interaction = token.connect(user1);
			await user1_interaction.bnbDeposit({ value: ethers.utils.parseEther('0.01') });
			await expect(token.mintTo(user1.address, wBanToMint, 200_000, { gasLimit: 200_000, gasPrice: gasPrice }))
				.to.emit(token, 'Fee').withArgs(user1.address, 200_000 * gasPrice);
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);

			// now ask to swap back to BAN
			await expect(user1_interaction.swapToBan("ban_1o3k8868n6d1679iz6fcz1wwwaq9hek4ykd58wsj5bozb8gkf38pm7njrr1o", 300))
				.to.be.revertedWith("Insufficient wBAN");
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);
		});

		it('Refuses to swap if Banano address is invalid', async () => {
			// mint some wBAN, first
			const wBanToMint = 123;
			const gasPrice = 20_000_000_000;
			const user1_interaction = token.connect(user1);
			await user1_interaction.bnbDeposit({ value: ethers.utils.parseEther('0.01') });
			await expect(token.mintTo(user1.address, wBanToMint, 200_000, { gasLimit: 200_000, gasPrice: gasPrice }))
				.to.emit(token, 'Fee').withArgs(user1.address, 200_000 * gasPrice);
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);

			// now ask to swap back to BAN
			await expect(user1_interaction.swapToBan("ban_whatever_wrong", wBanToMint))
				.to.be.revertedWith("Not a Banano address");
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);
		});

		it('Swaps if user has enough wBAN', async () => {
			// mint some wBAN, first
			const wBanToMint = 123;
			const gasPrice = 20_000_000_000;
			const user1_interaction = token.connect(user1);
			await user1_interaction.bnbDeposit({ value: ethers.utils.parseEther('0.01') });
			await expect(token.mintTo(user1.address, wBanToMint, 200_000, { gasLimit: 200_000, gasPrice: gasPrice }))
				.to.emit(token, 'Fee').withArgs(user1.address, 200_000 * gasPrice);
			expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);

			// now ask to swap back to BAN
			await expect(user1_interaction.swapToBan("ban_1o3k8868n6d1679iz6fcz1wwwaq9hek4ykd58wsj5bozb8gkf38pm7njrr1o", wBanToMint))
				.to.emit(token, 'Transfer').withArgs(user1.address, '0x0000000000000000000000000000000000000000', wBanToMint)
				.to.emit(token, 'SwapToBan').withArgs(user1.address, "ban_1o3k8868n6d1679iz6fcz1wwwaq9hek4ykd58wsj5bozb8gkf38pm7njrr1o", wBanToMint);
			expect(await token.balanceOf(user1.address)).to.equal(0);
		});
	});

});
