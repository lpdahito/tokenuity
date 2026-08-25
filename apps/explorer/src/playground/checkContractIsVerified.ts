// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/checkContractIsVerified.js").default()'

import { isVerified } from '../helpers/tokens.js'

export default async () => {
  const token = '0x8184502A93fDf27B78658910D212D26127EaEb78'

  try {
    let resp = await isVerified(token)
    console.log(resp)
  } catch(err: any) {
    console.log(err)
  }
}