import { BigNumber } from "ethers"

type WithdrawRequest = {
	amount: number,
	banAddress: string,
	bscAddress: string,
	provider: any
}

export default WithdrawRequest
