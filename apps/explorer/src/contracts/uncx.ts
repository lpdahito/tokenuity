import uniswapV2LockerAbi from './abis/uncx/uniswapV2Locker.json' // assert { type: 'json' }

interface IStructure {
  address: string,
  abi: Array<object>
}

export interface IUncx {
  uniswapV2Locker: IStructure,
}

let uncx: IUncx = {
  uniswapV2Locker: {
    address: '',
    abi: uniswapV2LockerAbi
  },
}

export { uncx }