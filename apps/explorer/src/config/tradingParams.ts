import { chain } from './chain.js'

import eth from './chain/mainnet/tradingParams.js'
import base from './chain/base/tradingParams.js'
import bsc from './chain/bsc/tradingParams.js'
import sepolia from './chain/sepolia/tradingParams.js'

let tradingParams = {
  '1': eth,
  '56': bsc,
  '8453': base,
  '11155111': sepolia,
}

export default tradingParams[chain.id.toString() as keyof typeof tradingParams]