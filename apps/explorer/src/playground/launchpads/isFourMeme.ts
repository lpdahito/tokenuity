// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/launchpads/isFourMeme.js").default()'

import { isFourMeme } from './../../helpers/launchpads.js'

export default async () => {
  const tokenAddress = '0x55f75fe8345db62fd30d57e0c60903a758484444'

  try {
    const _isFourMeme = await isFourMeme(tokenAddress)

    console.log('isFourMeme:', _isFourMeme)
  } catch (err: any) {
    console.log(err)
  }
}