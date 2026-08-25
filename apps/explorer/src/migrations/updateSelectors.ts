// docker run -it --rm --link mongo-server --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/migrations/updateSelectors.js").default()'

import * as mongoose from 'mongoose'

import * as models from './../models/models.js'

const {
  SelectorModel: Selector,
} = models

const user = process.env.MONGODB_USER_BASE_PROD
const pwd = process.env.MONGODB_PWD_BASE_PROD!

const databaseUrl = `mongodb+srv://${user}:${pwd}@main.r12qw3b.mongodb.net/main?retryWrites=true&w=majority`

export default async () => {
  console.log('inside migration')

  try  {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl, { autoIndex: false })

    console.log('connected to db')

    await Selector.updateMany(
      {}, { unwanted: null }
    )
  } catch (err: any)  {
    if ('message' in err) {
      console.log(err.message)
    }
  } finally {
    process.exit(0)
  }
}