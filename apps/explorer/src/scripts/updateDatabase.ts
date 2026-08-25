// [base]  CHAIN_ID=8453 npm run updateDatabase
// [bsc]   CHAIN_ID=56 npm run updateDatabase

import * as dotenv from 'dotenv'
dotenv.config()

import util from 'util'
import { exec } from "child_process"
const execPromise = util.promisify(exec)

export default async (fromDocker: boolean): Promise<void> => {
  const chainId = process.env.CHAIN_ID!
  console.log('CHAIN_ID:', chainId)

  let uri = ''
  let user = ''; let pwd = '';
  let command0 = ''; let command1 = ''; let command2 = '';
  
  switch (Number(chainId)) {
    case 8453:
      user = process.env.MONGODB_USER_BASE_PROD!
      pwd = process.env.MONGODB_PWD_BASE_PROD!

      uri = `mongodb+srv://${user}:${pwd}@main.r12qw3b.mongodb.net/base?retryWrites=true&w=majority`

      command0 = `docker exec mongo-server mongosh --eval \"use trendsbase\" --eval \"db.dropDatabase()\"`
      command1 = "docker exec mongo-server mongodump " + uri
      command2 = `docker exec mongo-server mongorestore --uri mongodb://localhost:27017/trendsbase dump/base`

      break;

    case 56:
      user = process.env.MONGODB_USER_BSC_PROD!
      pwd = process.env.MONGODB_PWD_BSC_PROD!

      uri = `mongodb+srv://${user}:${pwd}@main.r12qw3b.mongodb.net/bsc?retryWrites=true&w=majority`

      command0 = `docker exec mongo-server mongosh --eval \"use trendsbsc\" --eval \"db.dropDatabase()\"`
      command1 = "docker exec mongo-server mongodump " + uri
      command2 = `docker exec mongo-server mongorestore --noIndexRestore --uri mongodb://localhost:27017/trendsbsc dump/bsc`

      break;
  }

  try {
    const { stdout: stdout0, stderr: stderr0 } = await execPromise(command0) 
    console.log(stdout0); console.error(stderr0);

    const { stdout: stdout1, stderr: stderr1 } = await execPromise(command1) 
    console.log(stdout1); console.error(stderr1);

    const { stdout: stdout2, stderr: stderr2 } = await execPromise(command2) 
    console.log(stdout2); console.error(stderr2);
  } catch(err) {
    console.log(err)
  }
}