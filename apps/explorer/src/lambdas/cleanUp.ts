import type { HydratedDocument } from 'mongoose'

import { chain } from '../config/chain.js'
import { Logger } from '../config/logger.js'
import addresses from './../config/addresses.js'
import { providers } from '../config/provider.js'

import { contracts } from '../contracts/contracts.js'

import extractData from './../jobs/extractDataForFindPools.js'

import * as models from '@tokenuity/store'


import { IPrice } from '@tokenuity/types'

const {
  PoolModel: Pool,
} = models

export default async (
): Promise<void> => {
  let startBlock = 0
  let logAddresses: string[] = []

  try {
    
  } catch (err: any) {
    console.log(err)
    Logger.err({ error: err, report: true })
  }
}