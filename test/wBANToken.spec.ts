import chai, { expect } from 'chai';
import { Contract, utils } from 'ethers';
import { deployContract, MockProvider, solidity } from 'ethereum-waffle';
import wBANToken from '../build/wBANToken.json';

chai.use(solidity);

describe('wBANToken', () => {
  const [owner, user1, user2] = new MockProvider().getWallets();
  let token: Contract;

  beforeEach(async () => {
    token = await deployContract(owner, wBANToken);
	});

	it('Keeps track of user deposits in BNB to cover owner fees', async () => {
		const user1_interaction = token.connect(user1);
		await expect(() => user1_interaction.bnbDeposit({ value: 3 }))
			.to.changeEtherBalance(owner, 3);
		expect(await token.bnbBalanceOf(user1.address)).to.equal(3);
	});

	it('Refuses to mint wBAN if user did not deposit enough BNB for owner fees', async () => {
		const wBanToMint = 123;
		// user did not deposit any BNB
		await expect(token.mint(user1.address, wBanToMint, 200_000, { gasLimit: 200_000 }))
			.to.be.revertedWith('Insufficient BNB deposited');
		// user did not deposit enough BNB
		const user1_interaction = token.connect(user1);
		await user1_interaction.bnbDeposit({ value: utils.parseEther('0.0001') });
		await expect(token.mint(user1.address, wBanToMint, 200_000, { gasLimit: 200_000 }))
			.to.be.revertedWith('Insufficient BNB deposited');
	});

	it('Mints wBAN if user deposited enough BNB', async () => {
		const wBanToMint = 123;
		const user1_interaction = token.connect(user1);
		await user1_interaction.bnbDeposit({ value: utils.parseEther('0.001') });
		await token.mint(user1.address, wBanToMint, 200_000, { gasLimit: 200_000 });
		expect(await token.balanceOf(user1.address)).to.equal(wBanToMint);
	});

});
