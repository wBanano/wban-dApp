// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
type ClaimResponse = {
	signature: string
	result: ClaimResponseResult
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
enum ClaimResponseResult {
	// eslint-disable-next-line no-unused-vars
	Ok,
	// eslint-disable-next-line no-unused-vars
	Blacklisted,
	// eslint-disable-next-line no-unused-vars
	AlreadyDone,
	// eslint-disable-next-line no-unused-vars
	InvalidSignature,
	// eslint-disable-next-line no-unused-vars
	Error,
}

export { ClaimResponse, ClaimResponseResult }
