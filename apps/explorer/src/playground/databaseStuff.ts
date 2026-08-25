// docker run -it --rm --link mongo-server --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/databaseStuff.js").default()'

import * as mongoose from 'mongoose'
import * as models from './../models/models.js'

import { databaseUrl } from './../config/databaseUrl.js'

const {
  TokenModel: Token,
} = models

export default async () => {
  try  {
    console.log('connecting to database')
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl, { autoIndex: false })

    let token = new Token()
    console.log(token.lastSwap)

    // console.log(token)
  } catch (err: any)  {
    if ('message' in err) {
      console.log(err.message)
    }
  } finally {
    mongoose.disconnect()
    process.exit(0)
  }
}