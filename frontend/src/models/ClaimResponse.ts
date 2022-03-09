// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ClaimResponse = {
	signature: string
	result: ClaimResponseResult
}

enum ClaimResponseResult {
	Ok,
	Blacklisted,
	AlreadyDone,
	InvalidSignature,
	Error,
}

export { ClaimResponse, ClaimResponseResult }
