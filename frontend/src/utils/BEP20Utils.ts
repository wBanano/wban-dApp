import { IBEP20, IBEP20__factory, IApePair, IApePair__factory } from '@artifacts/typechain'
import { BigNumber, ethers, Signer } from 'ethers'

class BEP20Utils {
	static BENIS_CONTRACT_ADDRESS: string = process.env.VUE_APP_BENIS_CONTRACT || ''

	public async approve(stakingToken: string, signer: Signer) {
		console.debug(`Should approve unlimited spending of "${stakingToken}" LP tokens`)
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

	public async getLPDetails(account: string, lpStakedBalance: BigNumber, lpAddress: string, signer: Signer) {
		const lp: IApePair = await IApePair__factory.connect(lpAddress, signer)
		const addressToken0 = await lp.token0()
		const addressToken1 = await lp.token1()
		const token0 = await IBEP20__factory.connect(addressToken0, signer)
		const token0decimals = await token0.decimals()
		const liquidityToken0 = await token0.balanceOf(lpAddress)
		const token1 = await IBEP20__factory.connect(addressToken1, signer)
		const token1decimals = await token1.decimals()
		const liquidityToken1 = await token1.balanceOf(lpAddress)
		// pool total supply
		const totalSupply = await lp.totalSupply()
		// compute user liquidities -- pool token A * (user LP token / total supply) + pool token B * (user LP token / total supply)
		const userLiquidityToken0 = liquidityToken0.mul(lpStakedBalance).div(totalSupply)
		const userLiquidityToken1 = liquidityToken1.mul(lpStakedBalance).div(totalSupply)
		return {
			token0: {
				address: addressToken0,
				decimals: token0decimals,
				liquidity: liquidityToken0,
				user: userLiquidityToken0,
			},
			token1: {
				address: addressToken1,
				decimals: token1decimals,
				liquidity: liquidityToken1,
				user: userLiquidityToken1,
			},
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
		return IBEP20__factory.connect(tokenAddress, signer)
	}
}

export default BEP20Utils
