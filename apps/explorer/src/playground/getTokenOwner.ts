// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node ./dist/playground/getTokenOwner.js

import { ethers } from 'ethers'

import addresses from '../config/addresses'
import { contracts } from '../contracts/contracts'

import { wallets } from '../config/provider'

const main = async (
): Promise<void> => {
  let contract = new ethers.Contract(
    '0xB088ba37bd2559e7FAc9cd57E620aE1243f7A387',
    contracts.erc20.abi,
    wallets[0]
  )

  try {
    let owner = await contract.decimals()
    console.log(owner)
  } catch (err: any) {
    console.log(err)
  }
}

main()