import { performance } from 'perf_hooks'

import type { HydratedDocument } from 'mongoose'

import { Logger } from '../config/logger.js'
import addresses from './../config/addresses.js'

import * as models from '@tokenuity/store'

import { CheckTypes } from '@tokenuity/types'

const {
  CheckModel: Check,
  PoolModel: Pool,
  TokenModel: Token,
} = models

export default async (
): Promise<void> => {
  const computeStart = performance.now()

  let execTime = '0'
  let loopExecTime = '0'

  try {
    console.log('Token computing goes here...')

    const loopEnd = performance.now()
    loopExecTime = ((loopEnd - computeStart) / 1000).toFixed(2)
  } catch (err: any) {
    console.log(err)
    Logger.err({ error: err, report: true })
  } finally {
    const computeEnd = performance.now()
    execTime = ((computeEnd - computeStart) / 1000).toFixed(2)

    const check = await Check.create({
      type: CheckTypes.tokenCompute,
      execTime, loopExecTime,
    })

    // if (isLocal) { console.log(check) }
    console.log(check)
  }
}