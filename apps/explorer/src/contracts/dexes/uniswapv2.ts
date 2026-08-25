import pair from '../abis/uniswapv2/IUniswapV2Pair.json' // assert { type: 'json' }
import factory from '../abis/uniswapv2/IUniswapV2Factory.json' // assert { type: 'json' }
import SwapRouter02 from '../abis/uniswapv2/UniswapV2Router02.json' // assert { type: 'json' }

import { id } from 'ethers'

interface IStructure {
  address: string,
  abi: Array<object>
};

export interface IUniswapv2 {
  pool: IStructure
  factory: IStructure
  swapRouter02: IStructure
  swapEventSignature: string
  syncEventSignature: string
  pairCreatedEventSignature: string
};

let uniswapv2: IUniswapv2 = {
  factory: {
    address: '',
    abi: factory.abi
  },
  pool: {
    address: '',
    abi: pair.abi
  },
  swapRouter02: {
    address: '',
    abi: SwapRouter02.abi
  },
  pairCreatedEventSignature: id("PairCreated(address,address,address,uint256)"), // https://basescan.org/tx/0x9d8dbcc7c0c3ff71b5d985592edd7d47d292035badfbc22a6d71170863041966#eventlog
  swapEventSignature: id("Swap(address,uint256,uint256,uint256,uint256,address)"), // 0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822
  syncEventSignature: id("Sync(uint112,uint112)")
};

export { uniswapv2 }