import isLocal from '../../../config/isLocal.js'
import fromServerless from '../../fromServerless.js'

const user = process.env.MONGODB_USER_BASE!
const pwd = process.env.MONGODB_PWD_BASE!

let databaseUrl = fromServerless ? 'mongodb://localhost:27017/trendsbase' : 'mongodb://mongo-server:27017/trendsbase'
// let databaseUrl = 'mongodb://localhost:27017/trendsbase'
databaseUrl += '?replicaSet=rs0'

if (process.env.INSTANCE_FUNCTION_TYPE === 'findTrades') {}

if (!isLocal) {
  // databaseUrl = `mongodb+srv://${user}:${pwd}@main.r12qw3b.mongodb.net/base?retryWrites=true&w=majority`
}

export default databaseUrl