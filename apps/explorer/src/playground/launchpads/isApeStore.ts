// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/launchpads/isApeStore.js").default()'

import { isApeStore } from './../../helpers/launchpads.js'

export default async () => {
  const tokenAddress = '0x40ca72d5c6ee344c129da3a0236b5912201ede3b'

  try {
    const _isApeStore = await isApeStore(tokenAddress)

    console.log('isApeStore:', _isApeStore)
  } catch (err: any) {
    console.log(err)
  }
}