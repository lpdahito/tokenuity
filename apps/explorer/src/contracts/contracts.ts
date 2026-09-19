import erc20 from './erc20.js'
import { chainlink } from './chainlink.js'
import clanker from './launchpads/clanker.js'
import zora from './launchpads/zora.js'
import { virtuals, IVirtuals } from './dexes/virtuals.js'
import { uniswapv2, IUniswapv2 } from './dexes/uniswapv2.js'
import { uniswapv3, IUniswapv3 } from './dexes/uniswapv3.js'
import { uniswapv4, IUniswapv4 } from './dexes/uniswapv4.js'
// import { sushiswapv2 } from './dexes/sushiswapv2'

import { pancakeswapv2, IPancakeswapv2 } from './dexes/pancakeswapv2.js'
import { pancakeswapv3, IPancakeswapv3 } from './dexes/pancakeswapv3.js'

import { uncx, IUncx } from './uncx.js'
import { onlymoons, IOnlyMoons } from './onlymoons.js'
import multicall3 from './multicall3.js'
import toshimart from './toshimart.js'
import tokenuity from './tokenuity.js'

export interface IContract {
  erc20: {
    abi: Array<object>,
    selectors: {
      base: Array<string>,
      permitted: Array<string>,
      unwanted: Array<string>
    },
    transferSignature: string
  },
  chainlink: { aggregatorV3: {address: string, abi: Array<object>} },
  uniswapv2: IUniswapv2,
  uniswapv3: IUniswapv3,
  uniswapv4: IUniswapv4,
  pancakeswapv2: IPancakeswapv2,
  pancakeswapv3: IPancakeswapv3,
  virtuals: IVirtuals,
  onlymoons: IOnlyMoons,
  uncx: IUncx,
  clanker: {abi: Array<object>},
  zora: {abi: Array<object>},
  multicall3: {abi: Array<object>},
  toshimart: {abi: Array<object>},
  tokenuity: {abi: Array<object>},
}

let contracts: IContract = {
  erc20,
  chainlink,
  uniswapv2,
  uniswapv3,
  uniswapv4,
  pancakeswapv2,
  pancakeswapv3,
  clanker,
  zora,
  virtuals,
  multicall3,
  tokenuity,
  onlymoons,
  toshimart,
  uncx
}

export { contracts }