import quoterv2Abi from '../abis/pancakeswapv3/QuoterV2.json' // assert { type: 'json' }

import poolAbi from '../abis/pancakeswapv3/PancakeV3Pool.json' // assert { type: 'json' }
import factoryAbi from '../abis/pancakeswapv3/PancakeV3Factory.json' // assert { type: 'json' }
import SwapRouterAbi from '../abis/pancakeswapv3/SwapRouter.json' // assert { type: 'json' }
import UniversalRouterAbi from '../abis/pancakeswapv3/UniversalRouter.json' // assert { type: 'json' }

import permit2Abi from '../abis/pancakeswapv3/Permit2.json' // assert { type: 'json' }

import { id } from 'ethers'

interface IStructure {
  address: string,
  abi: Array<object>
}

export interface IPancakeswapv3 {
  factory: IStructure,
  quoterv2: IStructure,
  swapRouter: IStructure,
  universalRouter: IStructure,
  permit2: IStructure,
  pool: IStructure,
  swapEventSignature: string,
  poolCreatedEventSignature: string
}

let pancakeswapv3: IPancakeswapv3 = {
  factory: {
    address: '',
    abi: factoryAbi
  },
  quoterv2: {
    address: '',
    abi: quoterv2Abi
  },
  swapRouter: {
    address: '',
    abi: SwapRouterAbi
  },
  permit2: {
    address: '',
    abi: permit2Abi
  },
  universalRouter: {
    address: '',
    abi: UniversalRouterAbi
  },
  pool: {
    address: '',
    abi: poolAbi
  },
  poolCreatedEventSignature: id("PoolCreated(address,address,uint24,int24,address)"), // https://bscscan.com/tx/0xa1f9e9adc63cde625a2965edbf2aa8495ae590c4a886687bcca00d45811fec1d#eventlog
  swapEventSignature: id("Swap(address,address,int256,int256,uint160,uint128,int24,uint128,uint128)") // https://bscscan.com/address/0xcf59b8c8baa2dea520e3d549f97d4e49ade17057#code
}

export { pancakeswapv3 }