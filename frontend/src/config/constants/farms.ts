import { FarmConfig } from './types'
import bsc from './bsc/farms'
import polygon from './polygon/farms'

const bscFarms: FarmConfig[] = bsc
const polygonFarms: FarmConfig[] = polygon

export { bscFarms, polygonFarms }
