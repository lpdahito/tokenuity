// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/getTransactionCount.js").default()'
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/getTransactionCount.js").default()'

import { providers } from '../config/provider.js'

export default async () => {
  let count = 0
  let address = '0x9e8E0B5ef997e220cDC755bC1bf48a496De13C67'
  address = '0xBcD7147abd75836D5f4456C7C3815702531A09A0'

  try {
    count = await providers[0].getTransactionCount(address)

    console.log(address, count)
  } catch (err: any) {
    console.log(err)
  }
}