// eslint-disable-next-line @typescript-eslint/camelcase
import { IBEP20, IBEP20__factory, IApePair, IApePair__factory } from '@artifacts/typechain'
import { BigNumber, ethers, Signer } from 'ethers'

class BEP20Utils {
	static BENIS_CONTRACT_ADDRESS: string = process.env.VUE_APP_BENIS_CONTRACT || ''

	public async approve(stakingToken: string, signer: Signer) {
		console.debug(`Should approve unlimited spending of "${stakingToken}" LP tokens`)
		// eslint-disable-next-line @typescript-eslint/camelcase
		const token: IBEP20 = await IBEP20__factory.connect(stakingToken, signer)
		const txn = await token.approve(
			BEP20Utils.BENIS_CONTRACT_ADDRESS,
			BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
		)
		await txn.wait()
	}

	public async allowance(account: string, tokenAddress: string, signer: Signer): Promise<BigNumber> {
		const token: IBEP20 = await this.getBEP20Token(tokenAddress, signer)
		return await token.allowance(account, BEP20Utils.BENIS_CONTRACT_ADDRESS)
	}

	public async getLPBalance(account: string, lpAddress: string, signer: Signer): Promise<BigNumber> {
		const lp: IBEP20 = await this.getBEP20Token(lpAddress, signer)
		const balance = await lp.balanceOf(account)
		console.debug(`Balance of ${ethers.utils.formatEther(balance)} ${await lp.symbol()}`)
		return balance
	}

	public async getLPDetails(lpAddress: string, signer: Signer) {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const lp: IApePair = await IApePair__factory.connect(lpAddress, signer)
		const addressToken0 = await lp.token0()
		const addressToken1 = await lp.token1()
		// eslint-disable-next-line @typescript-eslint/camelcase
		const liquidityToken0 = await (await IBEP20__factory.connect(addressToken0, signer)).balanceOf(lpAddress)
		// eslint-disable-next-line @typescript-eslint/camelcase
		const liquidityToken1 = await (await IBEP20__factory.connect(addressToken1, signer)).balanceOf(lpAddress)
		return {
			token0: {
				address: addressToken0,
				liquidity: liquidityToken0
			},
			token1: {
				address: addressToken1,
				liquidity: liquidityToken1
			}
		}
	}

	public async getTokenBalance(account: string, tokenAddress: string, signer: Signer): Promise<BigNumber> {
		const token: IBEP20 = await this.getBEP20Token(tokenAddress, signer)
		return token.balanceOf(account)
	}

	public async getTokenSymbol(tokenAddress: string, signer: Signer): Promise<string> {
		const token: IBEP20 = await this.getBEP20Token(tokenAddress, signer)
		return token.symbol()
	}

	private async getBEP20Token(tokenAddress: string, signer: Signer): Promise<IBEP20> {
		// eslint-disable-next-line @typescript-eslint/camelcase
		return IBEP20__factory.connect(tokenAddress, signer)
	}
}

export default BEP20Utils
