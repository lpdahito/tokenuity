import quoterv2 from '../abis/uniswapv3/QuoterV2.json' // assert { type: 'json' }

import poolAbi from '../abis/uniswapv4/PoolManager.json' // assert { type: 'json' }
import quoterAbi from '../abis/uniswapv4/V4Quoter.json' // assert { type: 'json' }

import SwapRouter02 from '../abis/uniswapv3/SwapRouter02.json' // assert { type: 'json' }
import UniversalRouter from '../abis/uniswapv3/IUniversalRouter.json' // assert { type: 'json' }



import permit2Abi from './../abis/permit2/abi.json' // assert { type: 'json' }

import { id } from 'ethers'

interface IStructure {
  address: string,
  abi: Array<object>
}

export interface IUniswapv4 {
  // quoterv2: IStructure,
  // swapRouter02: IStructure,
  // universalRouter: IStructure,
  // permit2: IStructure,
  pool: IStructure,
  quoter: IStructure,
  swapEventSignature: string,
  poolManagerInitializeEventSignature: string
}

let uniswapv4: IUniswapv4 = {
  pool: {
    address: '',
    abi: poolAbi
  },
  quoter: {
    address: '',
    abi: quoterAbi
  },

  poolManagerInitializeEventSignature: id("Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)"), // https://basescan.org/tx/0x7d528d7807513d3274410f17f201c0a274e52d47e3f9680fc1a254328cf2add0#eventlog
  swapEventSignature: id("Swap(bytes32,address,int128,int128,uint160,uint128,int24,uint24)") // https://basescan.org/tx/0xe3f1dcfa571b1dd5765ec5004f757ed4db0a637f465910113df7dac4109fcb3f#eventlog
}

export { uniswapv4 }