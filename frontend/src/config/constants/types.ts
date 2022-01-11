export interface Address {
	dev: string
	staging: string
	production: string
}

export interface Token {
	symbol: string
	address?: Address
	decimals?: number
	projectLink?: string
	iconUrl?: string
}

export type TokensList = Record<string, Token>

export interface EndTime {
	dev: number
	staging: number
	production: number
}

export interface FarmConfig {
	pid: number
	lpSymbol: string
	lpAddresses: Address
	token: Token
	quoteToken: Token
	multiplier?: string
	endTime: EndTime
	dual?: {
		rewardPerBlock: number
		earnLabel: string
		endBlock: number
	}
}

export type Images = {
	lg: string
	md: string
	sm: string
	ipfs?: string
}
