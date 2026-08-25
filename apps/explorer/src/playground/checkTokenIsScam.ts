// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/checkTokenIsScam.js").default()'

import BigNumber from 'bignumber.js'

import addresses from '../config/addresses'

import { getBaseTokenPrice } from '../helpers/oracle'
import { canBuyAndSellToken } from '../helpers/tokens'

export default async () => {
  try {
    let baseTokenPrice = await getBaseTokenPrice()
    if (baseTokenPrice === BigInt(0)) return console.log('Could not get ETH price...')

    const amountIn = BigInt(BigNumber(baseTokenPrice.toString()).times(5).toFixed(0))

    const resp = await canBuyAndSellToken(
      '0x9bEec80e62aA257cED8b0edD8692f79EE8783777', amountIn, 2, [ addresses.tokens.base, '0x9bEec80e62aA257cED8b0edD8692f79EE8783777']
    )

    console.log('Can buy and sell token:', resp)
  } catch (err: any) {
    console.log(err)
  }
}