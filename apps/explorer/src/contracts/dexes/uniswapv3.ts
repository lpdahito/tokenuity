import quoterv2 from '../abis/uniswapv3/QuoterV2.json' // assert { type: 'json' }

import pool from '../abis/uniswapv3/IUniswapV3Pool.json' // assert { type: 'json' }
import factory from '../abis/uniswapv3/IUniswapV3Factory.json' // assert { type: 'json' }
import SwapRouter02 from '../abis/uniswapv3/SwapRouter02.json' // assert { type: 'json' }
import UniversalRouter from '../abis/uniswapv3/IUniversalRouter.json' // assert { type: 'json' }

import permit2Abi from './../abis/permit2/abi.json' // assert { type: 'json' }

import { id } from 'ethers'

interface IStructure {
  address: string,
  abi: Array<object>
}

export interface IUniswapv3 {
  factory: IStructure,
  quoterv2: IStructure,
  swapRouter02: IStructure,
  universalRouter: IStructure,
  permit2: IStructure,
  pool: IStructure,
  swapEventSignature: string,
  poolCreatedEventSignature: string
}

let uniswapv3: IUniswapv3 = {
  factory: {
    address: '',
    abi: factory.abi
  },
  quoterv2: {
    address: '',
    abi: quoterv2.abi
  },
  swapRouter02: {
    address: '',
    abi: SwapRouter02.abi
  },
  permit2: {
    address: '',
    abi: permit2Abi
  },
  universalRouter: {
    address: '',
    abi: UniversalRouter.abi
  },
  pool: {
    address: '',
    abi: pool.abi
  },
  poolCreatedEventSignature: id("PoolCreated(address,address,uint24,int24,address)"), // https://basescan.org/tx/0xabf85433091479a8c740cfdb0d5441ec121c83977c28a43dd62799649161cbd8#eventlog
  swapEventSignature: id("Swap(address,address,int256,int256,uint160,uint128,int24)") // 0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67
}

export { uniswapv3 }