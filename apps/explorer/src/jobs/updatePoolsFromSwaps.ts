import { performance } from 'perf_hooks'

import { ethers } from 'ethers'

import { contracts } from '../contracts/contracts.js'
import { IUniswapv2 } from '../contracts/dexes/uniswapv2.js'
import { IUniswapv3 } from '../contracts/dexes/uniswapv3.js'
import { IPancakeswapv2 } from '../contracts/dexes/pancakeswapv2.js'
import { IPancakeswapv3 } from '../contracts/dexes/pancakeswapv3.js'

import { chain } from '../config/chain.js'
import isLocal from './../config/isLocal.js'
import { providers } from '../config/provider.js'
import { Logger } from '../config/logger.js'

import * as models from '@tokenuity/store'

import { CheckTypes } from '@tokenuity/types'

export interface PoolsFromSwaps {
  [key: string]: PoolFromSwap
}

interface PoolFromSwap {
  block: number
  amount0: string
  amount1: string
  logIndex: number
  lastSync: number
  swapCount: number
  swap0OutCount: number
  swap1OutCount: number
}

interface PoolInsertDataFromSwap {
  updateOne: {
    filter: {
      address: string
    },
    update: [
      {
        $set: {
          block: number
          amount0: string
          amount1: string
          lastSync: number
          swapCount: { $add: ["$swapCount", number] }
          swap0OutCount: { $add: ["$swap0OutCount", number] }
          swap1OutCount: { $add: ["$swap1OutCount", number] }
          firstSwap: {
            $cond: [
              {
                $or: [
                  { $eq: ["$firstSwap", 0] },
                  { $eq: ["$firstSwap", null] }
                ]
              },
              number,
              "$firstSwap"
            ]
          },
          firstSwaps: {
            $cond: [
              { $lt: [ { $size: { $ifNull: ["$firstSwaps", []] } }, number ] },
              { $concatArrays: [{ $ifNull: ["$firstSwaps", []] }, [[ string, string ]]] },
              "$firstSwaps"
            ]
          }
        },
      },
      // {
      //   $inc: {
      //     swapCount: number
      //   }
      // }
    ],
    upsert: boolean
  }
}

interface TokenSwapInsertDataFromSwap {
  updateOne: {
    filter: {
      tx: string
    },
    update: {
      pool: string
      block: number
      amount0: string
      amount1: string
      logIndex: number
      timestamp: number
    },
    upsert: boolean
  }
}

const {
  PoolModel: Pool,
  CheckModel: Check,
  TokenSwapModel: TokenSwap,
} = models

export default async (
  logs: ethers.Log[],
  highestBlock: number
): Promise<void> => {
  const extractionStart = performance.now()

  const poolInsertDataArray: PoolInsertDataFromSwap[] = []
  const tokenSwapInsertDataArray: TokenSwapInsertDataFromSwap[] = []

  let swapCount = 0; let poolCount = 0;

  let execTime = '0'
  let loopExecTime = '0'
  let timePerSwap = '0'
  
  let pools: PoolsFromSwaps = {}

  // logs = logs.reverse()

  let currentBlock = 0

  let highestTimestamp = 0
  let timestamp = 0

  try {
    const block = await providers[0].getBlock(highestBlock)
    if (!block) { return }

    highestTimestamp = block.timestamp

    for (let log of logs) {
      if (log.removed) continue

      let poolAddress: string | null = null

      if (currentBlock !== log.blockNumber) {
        currentBlock = log.blockNumber

        const blockSpread = highestBlock - currentBlock
        const timeSpread = chain.timePerBlock * blockSpread

        timestamp = Math.floor(highestTimestamp - timeSpread)
      }

      let dexProtocol: string | undefined

      if (chain.name === 'bsc') {
        switch (log.topics[0]) {
          case contracts.pancakeswapv2.swapEventSignature:
            dexProtocol = 'pancakeswapv2'; break;
          // case contracts.pancakeswapv3.poolCreatedEventSignature:
          //   eventType = 'poolCreated'
          //   dexProtocol = 'pancakeswapv3'
          //   break;
        }
      } else if (chain.name === 'base') {
        switch (log.topics[0]) {
          case contracts.uniswapv2.swapEventSignature:
            dexProtocol = 'uniswapv2'; break;
          
          case contracts.uniswapv3.swapEventSignature:
            dexProtocol = 'uniswapv3'; break;

          case contracts.uniswapv4.swapEventSignature:
            dexProtocol = 'uniswapv4'; break;
        }
      }

      if (!dexProtocol) continue

      // let dexContract = contracts[dexProtocol as keyof typeof contracts] as IPancakeswapv3 | IPancakeswapv2 | IUniswapv3 | IUniswapv2
      // let iface = new ethers.Interface(dexContract.pool.abi)
    
      // let parsedLog = iface.parseLog({
      //   topics: log.topics.map((x) => x), data: log.data
      // })
      
      // if (!parsedLog) continue

      let amount0isOut = false
      let amount0 = 0n; let amount1 = 0n;

      switch (dexProtocol) {
        case 'uniswapv2':
        case 'pancakeswapv2':
          poolAddress = log.address

          const {
            amount0In, amount1In, amount0Out, amount1Out
          } = parseAmountsV2(log.data)

          if (amount0In > 0n) {
            amount0 = amount0In; amount1 = amount1Out;
          } else if (amount1In > 0n) {
            amount0isOut = true
            amount0 = amount0Out; amount1 = amount1In;
          }
          
          break;

        case 'uniswapv3':
        case 'pancakeswapv3':
          poolAddress = log.address

          const {
            amount0: v3Amount0, amount1: v3Amount1
          } = parseAmounts(log.data)

          if (v3Amount0 < 0n) {
            amount0 = -v3Amount0; amount0isOut = true
          } else {
            amount0 = v3Amount0
          }

          amount1 = v3Amount1 < 0n ? -v3Amount1 : v3Amount1
          
          break;

        case 'uniswapv4':
          poolAddress = log.topics[1]

          const {
            amount0: v4Amount0, amount1: v4Amount1
          } = parseAmounts(log.data)

          if (v4Amount0 < 0n) {
            amount0 = -v4Amount0; amount0isOut = true
          } else {
            amount0 = v4Amount0
          }

          amount1 = v4Amount1 < 0n ? -v4Amount1 : v4Amount1

          break;
      }

      if (!poolAddress) { continue }
      if (amount0 === 0n && amount1 === 0n) { continue }

      tokenSwapInsertDataArray.push(<TokenSwapInsertDataFromSwap>{
        updateOne: {
          filter: {
            tx: log.transactionHash
          },
          update: {
            timestamp,
            pool: poolAddress,
            block: currentBlock,
            logIndex: log.index,
            amount0: amount0.toString(),
            amount1: amount1.toString(),
          },
          upsert: true
        }
      })

      let swap0OutCount = 0; let swap1OutCount = 0
      amount0isOut ? swap0OutCount++ : swap1OutCount++

      if (!(poolAddress in pools)) {
        pools[poolAddress] = {
          block: currentBlock, logIndex: log.index, lastSync: timestamp,
          amount0: amount0.toString(), amount1: amount1.toString(), swap0OutCount: 0, swap1OutCount: 0, swapCount: 0
        }

        poolCount++
      } else {
        if (
          currentBlock > pools[poolAddress].block
          || (
            pools[poolAddress].block === currentBlock
            && log.index > pools[poolAddress]?.logIndex
          )
        ) {
          pools[poolAddress].block = currentBlock
          pools[poolAddress].logIndex = log.index
          pools[poolAddress].lastSync = timestamp
          pools[poolAddress].amount0 = amount0.toString()
          pools[poolAddress].amount1 = amount1.toString()
        }
      }

      pools[poolAddress].swapCount++
      pools[poolAddress].swap0OutCount += swap0OutCount
      pools[poolAddress].swap1OutCount += swap1OutCount

      swapCount++
    }

    const safeFirstSwaps = { $ifNull: ["$firstSwaps", []] }

    for (const address in pools) {
      poolInsertDataArray.push(<PoolInsertDataFromSwap>{
        updateOne: {
          filter: { address },
          update: [
            {
              $set: {
                block: pools[address].block,
                amount0: pools[address].amount0,
                amount1: pools[address].amount1,
                lastSync: pools[address].lastSync,
                swapCount: { $add: ["$swapCount", pools[address].swapCount] },
                swap0OutCount: { $add: ["$swap0OutCount", pools[address].swap0OutCount] },
                swap1OutCount: { $add: ["$swap1OutCount", pools[address].swap1OutCount] },
                firstSwap: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ["$firstSwap", 0] },
                        { $eq: ["$firstSwap", null] }
                      ]
                    },
                    pools[address].lastSync,
                    "$firstSwap"
                  ]
                },
                firstSwaps: {
                  $cond: [
                    { $lt: [ { $size: safeFirstSwaps }, 200 ] },
                    { $concatArrays: [ safeFirstSwaps, [[ pools[address].amount0, pools[address].amount1 ]]] },
                    "$firstSwaps"
                  ]
                }
              },
            },
          ],
          upsert: false
        }
      })
    }

    const loopExtractionEnd = performance.now()
    loopExecTime = ((loopExtractionEnd - extractionStart) / 1000).toFixed(2)

    await saveDataFromSwaps(
      poolInsertDataArray, tokenSwapInsertDataArray
    )
  } catch (err: any)  {
    Logger.err({ error: err, report: true })
  } finally {
    const extractionEnd = performance.now()
    const _execTime = (extractionEnd - extractionStart) / 1000

    if (swapCount) {
      timePerSwap = (_execTime / swapCount).toFixed(4)
    }

    execTime = _execTime.toFixed(2)

    const check = await Check.create({
      type: CheckTypes.swapExtraction,
      execTime, loopExecTime, timePerSwap, swapCount, poolCount
    })

    // if (isLocal) { console.log(check) }
    console.log(check)
  }
}

const saveDataFromSwaps = async (
  poolInsertDataArray: PoolInsertDataFromSwap[],
  tokenSwapInsertDataArray: TokenSwapInsertDataFromSwap[],
): Promise<void> => {
  let promises = []

  try {
    if (poolInsertDataArray.length) {
      promises.push(
        Pool.bulkWrite(
          poolInsertDataArray, {
            ordered: false, writeConcern: { w: 0, j: false }
          }
        )
      )
    }

    // if (tokenSwapInsertDataArray.length) {
    //   promises.push(
    //     TokenSwap.bulkWrite(
    //       tokenSwapInsertDataArray, {
    //         ordered: false, writeConcern: { w: 0, j: false }
    //       }
    //     )
    //   )
    // }

    if (promises.length) {
      await Promise.all(promises)
    }
  } catch (err) {
    console.log(err)
  }
}

const parseAmountsV2 = (
  data: string
): {
  amount0In: bigint, amount1In: bigint, amount0Out: bigint, amount1Out: bigint
} => {
  const clean = data.startsWith("0x") ? data.slice(2) : data

  const amount0In  = BigInt("0x" + clean.slice(0, 64))
  const amount1In  = BigInt("0x" + clean.slice(64, 128))
  const amount0Out = BigInt("0x" + clean.slice(128, 192))
  const amount1Out = BigInt("0x" + clean.slice(192, 256))

  return { amount0In, amount1In, amount0Out, amount1Out }
}

const parseAmounts = (
  data: string
): {
  amount0: bigint, amount1: bigint
} => {
  const clean = data.startsWith("0x") ? data.slice(2) : data

  // Must be at least 2 ABI words (64*2 hex chars)
  if (clean.length < 64 * 2) {
    throw new Error(`Invalid swap V3 data length ${clean.length}`)
  }

  const w0 = clean.slice(0, 64)      // amount0
  const w1 = clean.slice(64, 128)    // amount1

  const toSigned = (hex: string) => {
    let x = BigInt("0x" + hex)
    // Convert from unsigned to signed 256-bit int
    if (x > (1n << 255n) - 1n) {
      x -= 1n << 256n
    }
    return x
  }

  return {
    amount0: toSigned(w0), amount1: toSigned(w1)
  }
}