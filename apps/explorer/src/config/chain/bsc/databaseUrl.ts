import isLocal from '../../../config/isLocal.js'
import fromServerless from '../../fromServerless.js'

const user = process.env.MONGODB_USER_BSC!
const pwd = process.env.MONGODB_PWD_BSC!

let databaseUrl = fromServerless ? 'mongodb://localhost:27017/trendsbsc' : 'mongodb://mongo-server:27017/trendsbsc'
if (process.env.INSTANCE_FUNCTION_TYPE === 'findTrades') {
  databaseUrl += '?replicaSet=rs0'
}

if (!isLocal) {
  // databaseUrl = `mongodb+srv://${user}:${pwd}@main.r12qw3b.mongodb.net/bsc?retryWrites=true&w=majority`
}

export default databaseUrl
