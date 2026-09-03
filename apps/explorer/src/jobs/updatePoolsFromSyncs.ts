import { performance } from 'perf_hooks'

import { ethers } from 'ethers'

import { contracts } from '../contracts/contracts.js'
import { IUniswapv2 } from '../contracts/dexes/uniswapv2.js'
import { IUniswapv3 } from '../contracts/dexes/uniswapv3.js'
import { IPancakeswapv2 } from '../contracts/dexes/pancakeswapv2.js'
import { IPancakeswapv3 } from '../contracts/dexes/pancakeswapv3.js'

import { chain } from '../config/chain.js'
import { providers } from '../config/provider.js'
import { Logger } from '../config/logger.js'

import * as models from '@tokenuity/store'

import { CheckTypes } from './../types.js'

export interface PoolsFromSyncs {
  [key: string]: PoolFromSync
}

interface PoolFromSync {
  block: number
  logIndex: number
  reserve0: string
  reserve1: string
  lastSync: number
}

interface PoolInsertDataFromSync {
  updateOne: {
    filter: {
      address: string
    },
    update: {
      block: number,
      lastSync: number,
      reserve0: string,
      reserve1: string,
    },
    upsert: boolean
  }
}

const {
  PoolModel: Pool,
  CheckModel: Check,
} = models

export default async (
  logs: ethers.Log[]
): Promise<void> => {
  const extractionStart = performance.now()

  const poolInsertDataArray: PoolInsertDataFromSync[] = []

  let syncCount = 0
  let validSyncCount = 0

  let tokenCount = 0
  let newPoolCount = 0

  let execTime = '0'
  
  let pools: PoolsFromSyncs = {}

  logs = logs.reverse()

  let highestBlock = 0
  let currentBlock = 0

  let highestTimestamp = 0
  let timestamp = 0

  try {
    for (let log of logs) {
      if (log.removed) continue

      syncCount++

      const address = log.address

      if (currentBlock !== log.blockNumber) {
        currentBlock = log.blockNumber

        if (!highestBlock && !highestTimestamp) {
          const block = await providers[0].getBlock(currentBlock)
          if (!block) continue

          highestBlock = currentBlock
          highestTimestamp = block.timestamp
        }

        const blockSpread = highestBlock - currentBlock
        const timeSpread = chain.timePerBlock * blockSpread

        timestamp = Math.floor(highestTimestamp - timeSpread)
      }

      if (
        pools[address]?.block > currentBlock
        || (
          pools[address]?.block === currentBlock
          && pools[address]?.logIndex > log.index
        )
      ) { continue }

      let dexProtocol: string | undefined
      let eventType: string | undefined

      if (chain.name === 'bsc') {
        switch (log.topics[0]) {
          case contracts.pancakeswapv2.syncEventSignature:
            eventType = 'sync'
            dexProtocol = 'pancakeswapv2'
            break;
          // case contracts.pancakeswapv3.poolCreatedEventSignature:
          //   eventType = 'poolCreated'
          //   dexProtocol = 'pancakeswapv3'
          //   break;
        }
      } else if (chain.name === 'base') {
        switch (log.topics[0]) {
          case contracts.uniswapv2.syncEventSignature:
            eventType = 'sync'
            dexProtocol = 'uniswapv2'
            break;
        }
      }

      if (!dexProtocol) continue

      let dexContract = contracts[dexProtocol as keyof typeof contracts] as IPancakeswapv3 | IPancakeswapv2 | IUniswapv3 | IUniswapv2
      let iface = new ethers.Interface(dexContract.pool.abi)
    
      let parsedLog = iface.parseLog({
        topics: log.topics.map((x) => x), data: log.data
      })
      
      if (!parsedLog) continue
    
      const reserve0 = parsedLog.args[0]
      const reserve1 = parsedLog.args[1]

      pools[address] = {
        block: currentBlock, logIndex: log.index, lastSync: timestamp, reserve0, reserve1
      }

      validSyncCount++
    }

    for (const address in pools) {
      poolInsertDataArray.push(<PoolInsertDataFromSync>{
        updateOne: {
          filter: { address },
          update: {
            block: pools[address].block,
            lastSync: pools[address].lastSync,
            reserve0: pools[address].reserve0,
            reserve1: pools[address].reserve1,
          },
          upsert: false
        }
      })
    }

    console.log('Pools:', poolInsertDataArray.length)

    if (poolInsertDataArray.length) {
      const resp = await Pool.bulkWrite(
        poolInsertDataArray, { ordered: false }
      )

      console.log('modifiedCount:', resp.modifiedCount)
    }

    console.log('syncCount:', syncCount)
    console.log('validSyncCount:', validSyncCount)
  } catch (err: any)  {
    Logger.err({ error: err, report: true })
  } finally {
    const extractionEnd = performance.now()
    execTime = ((extractionEnd - extractionStart) / 1000).toFixed(2)

    const check = await Check.create({
      type: CheckTypes.poolExtraction,
      execTime, tokenCount, newPoolCount
    })

    console.log(check)
  }
}