// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/getContractCreator.js").default()'
// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/getContractCreator.js").default()'

import { getTokenCreator, } from '../helpers/tokens.js'

// const address = '0xf3bdABFfe688578C3740fB30684cAe20f296f263' // clean 8453
const address = '0xfa8E4052b8Fe8ed24D8e9de088CBfd50E6984444' // 56
// const address = '0x7A226B9A2d01bdB2FEe8D69c3181E1f6E25C6a66'
// const address ='0xd8000337Ec869e148d4383a1b04Dde4c1E5277d4'

export default async () => {
  try  {
    let creator = await getTokenCreator(address)

    console.log(creator)
  } catch (err)  {
    console.log(err)
  }
}