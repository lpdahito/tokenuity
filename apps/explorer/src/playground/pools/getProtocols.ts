// docker run -it --rm --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/pools/getProtocols.js").default()'

import { ethers } from 'ethers'

import { contracts } from './../../contracts/contracts.js'
import { IVirtuals } from './../../contracts/dexes/virtuals.js'
import { IUniswapv2 } from './../../contracts/dexes/uniswapv2.js'
import { IUniswapv3 } from './../../contracts/dexes/uniswapv3.js'
import { IPancakeswapv2 } from './../../contracts/dexes/pancakeswapv2.js'

import { providers, wallets } from './../../config/provider.js'

import { isPancakeswapv2Pool, isSushiswapv2Pool, isUniswapv2Pool, isUniswapv3Pool, isVirtualsPool, } from './../../helpers/pools.js'

import { DexProtocols, } from './../../types.js'

export default async () => {
  let dexProtocol = 'uniswapv2'
  let address = '0x6EC3c3E94e23734C2E95Bb176c056CF9280a88c1'

  dexProtocol = 'uniswapv3'
  address = '0xE4EbF0D2AdD1FcDe12F5816F3D63B2AeFF1D9855'

  // dexProtocol = 'virtuals'
  // address = '0x43c091825F2AB13D5c89e4d201821a4F6674FB78'

  let dexContract = contracts[dexProtocol as keyof typeof contracts] as IPancakeswapv2 | IUniswapv3 | IUniswapv2 | IVirtuals

  let poolContract = new ethers.Contract(
    address, dexContract.pool.abi, providers[0]
  )

  // Confirm pool was created with UniswapV2 or UniswapV3 Factory
  let _isUniswapv2Pool = false;
  let _isUniswapv3Pool = false;
  let _isSushiswapv2Pool = false;
  let _isPancakeswapv2Pool = false;
  let _isVirtualsPool = false;

  let dexNumber: number | undefined

  try  {
    switch (dexProtocol) {
      case ('uniswapv2'):
        if (await isUniswapv2Pool(poolContract)) {
          _isUniswapv2Pool = true
          dexNumber = DexProtocols.uniswapv2
        } else if (await isSushiswapv2Pool(poolContract)) {
          _isSushiswapv2Pool = true
          dexNumber = DexProtocols.sushiswapv2
        }
        break;

      case ('uniswapv3'):
        if (await isUniswapv3Pool(poolContract)) {
          _isUniswapv3Pool = true
          dexNumber = DexProtocols.uniswapv3
        }
        break;

      case ('pancakeswapv2'):
        if (await isPancakeswapv2Pool(poolContract)) {
          _isPancakeswapv2Pool = true
          dexNumber = DexProtocols.pancakeswapv2
        }
        break;

      case ('virtuals'):
        if (await isVirtualsPool(poolContract)) {
          _isVirtualsPool = true
          dexNumber = DexProtocols.virtuals
        }

        break;
    }

    if (
      !_isUniswapv2Pool
      && !_isUniswapv3Pool
      && !_isSushiswapv2Pool
      && !_isPancakeswapv2Pool
      && !_isVirtualsPool
    ) { return console.log('Unknown protocol') }

    console.log('dexNumber:', dexNumber)
  } catch (err: any)  {
    if ('message' in err) {
      console.log(err.message)
    }
  }
}