// docker run -it --rm --link mongo-server --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node ./dist/playground/getBlocks.js

import { contracts } from '../contracts/contracts'

import { providers } from '../config/provider'

const getBlocks =  async (
): Promise<void> => {
  try {
    let endBlock = await providers[0].getBlockNumber()
    let startBlock = endBlock - 2

    let filter = {
      fromBlock: startBlock,
      toBlock: endBlock,
      address: [],
      topics: [
        [
          contracts.uniswapv2.syncEventSignature,
        ]
      ]
    }

    let logs = await providers[0].getLogs(filter)
    if (!logs.length) return

    logs = logs.reverse()

    for (let log of logs) {
      console.log(log.blockNumber)
    }
  } catch (err: any) {
    console.error(err)
  }
}

getBlocks()