import { connect, ensureIndexes } from '@tokenuity/store'

import { Logger } from './config/logger.js'

import cleanUp from './lambdas/cleanUp.js'

import findPools from './lambdas/findPools.js'
import findSwaps from './lambdas/findSwaps.js'
import findTransfers from './lambdas/findTransfers.js'

import computeTokenData from './lambdas/computeTokenData.js'

/** Each container runs one function, selected by INSTANCE_FUNCTION_TYPE. Interval is the wait after a run completes. */
const functions = {
  findPools: { run: findPools, intervalSeconds: 10 },
  findSwaps: { run: findSwaps, intervalSeconds: 10 },
  findTransfers: { run: findTransfers, intervalSeconds: 10 },
  computeTokenData: { run: computeTokenData, intervalSeconds: 30 },
  cleanUp: { run: cleanUp, intervalSeconds: 5 * 60 },
}

type FunctionName = keyof typeof functions

const isFunctionName = (name: string | undefined): name is FunctionName =>
  name !== undefined && Object.hasOwn(functions, name)

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Do the work, then wait from completion, so two runs never overlap. */
const loop = async (name: FunctionName) => {
  const { run, intervalSeconds } = functions[name]

  while (true) {
    try {
      await run()
    } catch (err: any) {
      Logger.err({ error: err, report: true })
    }

    await sleep(intervalSeconds * 1000)
  }
}

const main = async () => {
  const name = process.env.INSTANCE_FUNCTION_TYPE

  if (!isFunctionName(name)) {
    throw new Error(
      `INSTANCE_FUNCTION_TYPE must be one of ${Object.keys(functions).join(', ')}, got: ${name ?? '(unset)'}`
    )
  }

  await connect()
  console.log(`Connected to database. Running ${name}.`)

  // One container owns index builds, so they don't race on startup
  if (name === 'findPools') {
    await ensureIndexes()
    console.log('Indexes in sync.')
  }

  await loop(name)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
