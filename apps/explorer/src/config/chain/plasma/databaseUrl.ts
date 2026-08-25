import isLocal from '../../../config/isLocal.js'
import fromServerless from '../../fromServerless.js'

const user = process.env.MONGODB_USER_PLASMA!
const pwd = process.env.MONGODB_PWD_PLASMA!

let databaseUrl = fromServerless ? 'mongodb://localhost:27017/trendsplasma' : 'mongodb://mongo-server:27017/trendsplasma'
if (process.env.INSTANCE_FUNCTION_TYPE === 'findTrades') {
  databaseUrl += '?replicaSet=rs0'
}

if (!isLocal) {
  // databaseUrl = `mongodb+srv://${user}:${pwd}@main.r12qw3b.mongodb.net/plasma?retryWrites=true&w=majority`
}

export default databaseUrl
