// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/oracle/getVirtualPrice.js").default()'

import { getVirtualPrice } from './../../helpers/oracle.js'

export default async () => {
  try {
    const price = await getVirtualPrice()
    console.log(price)
  } catch (err: any) {
    console.log(err)
  }
}