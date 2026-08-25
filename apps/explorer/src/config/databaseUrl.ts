// import * as dotenv from 'dotenv'
// dotenv.config()

// Legacy URL: `mongodb+srv://${user}:${pwd}@tokenuity-swapper-1.3q8gmbp.mongodb.net/${name}?retryWrites=true&w=majority`

import { chain } from './chain.js'
import base from './chain/base/databaseUrl.js'
import bsc from './chain/bsc/databaseUrl.js'

const databaseUrls = {
  '56': bsc,
  '8453': base,
}

const databaseUrl = databaseUrls[chain.id.toString() as keyof typeof databaseUrls]

export { databaseUrl, databaseUrls }
