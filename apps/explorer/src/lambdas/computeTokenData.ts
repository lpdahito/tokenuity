import { performance } from 'perf_hooks'

import type { HydratedDocument } from 'mongoose'

import { Logger } from '../config/logger.js'
import { formatCheck } from './../utils/formatCheck.js'
import addresses from './../config/addresses.js'

import * as models from '@tokenuity/store'

import { CheckTypes } from '@tokenuity/types'

const {
  CheckModel: Check,
  PoolModel: Pool,
  TokenModel: Token,
} = models

let execTime = '0'

export default async (
): Promise<void> => {
  const start = performance.now()

  try {
    console.log('Token computing goes here...')

  } catch (err: any) {
    console.log(err)
    Logger.err({ error: err, report: true })
  } finally {
    const end = performance.now()
    execTime = ((end - start) / 1000).toFixed(2)

    try {
      const check = await Check.create({
        type: CheckTypes.computeTokenData,
        execTime,
      })

      console.log(formatCheck(check))
    } catch (err) {
      Logger.err({ error: err, report: true })
    }
  }
}