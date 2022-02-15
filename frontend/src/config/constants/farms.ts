import { FarmConfig } from './types'
import bsc from './bsc/farms'
import polygon from './polygon/farms'
import fantom from './fantom/farms'

const bscFarms: FarmConfig[] = bsc
const polygonFarms: FarmConfig[] = polygon
const fantomFarms: FarmConfig[] = fantom

export { bscFarms, polygonFarms, fantomFarms }
