import FFactory from '../abis/virtuals/FFactory.json'
import FPair from '../abis/virtuals/FPair.json'

import { id } from 'ethers'

interface IStructure {
  address: string
  abi: Array<object>
};

export interface IVirtuals {
  factory: IStructure
  pool: IStructure
  // swapRouter02: IStructure
  swapEventSignature: string
  // syncEventSignature: string
};

let virtuals: IVirtuals = {
  factory: {
    address: '',
    abi: FFactory
  },
  pool: {
    address: '',
    abi: FPair
  },
  // swapRouter02: {
  //   address: '',
  //   abi: SwapRouter02.abi
  // },
  swapEventSignature: id("Swap(uint256,uint256,uint256,uint256)") // 0x913b7d5136d78b5e7f2aea157f5ea1a106248443940b11d29c862e5c65cbe9cc
};

export { virtuals }