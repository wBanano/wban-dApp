// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asyncFilter = async (arr: Array<any>, predicate: any) => {
	const results = await Promise.all(arr.map(predicate))
	return arr.filter((_v, index) => results[index])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sleep = (ms: number) => new Promise((resolve: any) => setTimeout(resolve, ms))

export { asyncFilter, sleep }
