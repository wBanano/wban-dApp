type WithdrawRequest = {
	amount: number
	banAddress: string
	blockchainAddress: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	provider: any
}

export default WithdrawRequest
