import pairAbi from '../abis/pancakeswapv2/PancakePair.json' // assert { type: 'json' }
import factoryAbi from '../abis/pancakeswapv2/PancakeFactory.json' // assert { type: 'json' }
import routerAbi from '../abis/pancakeswapv2/PancakeRouter.json' // assert { type: 'json' }

import { id } from 'ethers'

interface IStructure {
  address: string,
  abi: Array<object>
};

export interface IPancakeswapv2 {
  factory: IStructure
  pool: IStructure
  router: IStructure
  swapEventSignature: string
  syncEventSignature: string
  pairCreatedEventSignature: string
};

let pancakeswapv2: IPancakeswapv2 = {
  factory: {
    address: '',
    abi: factoryAbi
  },
  pool: {
    address: '',
    abi: pairAbi
  },
  router: {
    address: '',
    abi: routerAbi
  },
  pairCreatedEventSignature: id("PairCreated(address,address,address,uint256)"), // https://bscscan.com/tx/0xd1356279bc241cdf416429bc79fbb3213266919829a981bfcf46a46550db2129#eventlog
  swapEventSignature: id("Swap(address,uint256,uint256,uint256,uint256,address)"), // 0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822
  // swapEventSignature: id("Swap(address,uint,uint,uint,uint,address)"), from BscScan => uint not uint256
  syncEventSignature: id("Sync(uint112,uint112)")
};

export { pancakeswapv2 }