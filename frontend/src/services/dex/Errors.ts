class InsufficientLiquidityError extends Error {
	constructor(message: string) {
		super(message)
		// 👇️ because we are extending a built-in class
		Object.setPrototypeOf(this, InsufficientLiquidityError.prototype)
	}
}

type DEXError = InsufficientLiquidityError

export { DEXError, InsufficientLiquidityError }
