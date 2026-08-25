import tokenLockerManagerV1Abi from './abis/onlymoons/tokenLockerManagerV1.json' // assert { type: 'json' }

import { id } from 'ethers'

interface IStructure {
  address: string,
  abi: Array<object>
}

export interface IOnlyMoons {
  tokenLockerManagerV1: IStructure,
  lockerCreatedEventSignature: string
}

let onlymoons: IOnlyMoons = {
  tokenLockerManagerV1: {
    address: '',
    abi: tokenLockerManagerV1Abi
  },
  lockerCreatedEventSignature: id("TokenLockerCreated(uint40,address,address,address,address,uint256,uint40)")
}

export { onlymoons }