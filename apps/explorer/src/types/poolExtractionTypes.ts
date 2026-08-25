import { DexProtocols, Launchpads } from './../types.js'

export interface PoolsFromExtractions {
  [key: string]: PoolFromExtraction
}

export interface PoolFromExtraction {
  fee: number
  block: number
  token0: string
  token1: string
  decimals0: number
  decimals1: number
  createdAt: number
  firstBlock: number
  tickSpacing: number
  hooks: string | null
  protocol: DexProtocols
}

export interface PoolInsertData {
  updateOne: {
    filter: {
      address: string
    }
    update: {
      fee: number
      block: number
      token0: string
      token1: string
      createdAt: number
      decimals0: number
      decimals1: number
      firstBlock: number
      tickSpacing: number
      hooks: string | null
      protocol: DexProtocols
      
      lockedPercentage: number
    }
    upsert: boolean
  }
}

export interface TokenInsertData {
  updateOne: {
    filter: {
      address: string
    },
    update: {
      name: string
      symbol: string
      decimals: number
      launchpad: Launchpads | null
      // $addToSet: { protocols: DexProtocols }
    },
    upsert: boolean
  }
}