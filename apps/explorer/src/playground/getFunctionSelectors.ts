// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node ./dist/playground/getFunctionSelectors.js

// import { functionArguments, functionSelectors } from 'evmole'

// const evmole = require('evmole');

import addresses from '../config/addresses.js'
import { providers, wallets } from '../config/provider.js'

const getFunctionSelectors = async (
): Promise<void> => {
  try {
    const evmole = await import('evmole')

    const bytecode = await providers[0].getCode('0x24fCA802DadE850a7c4c8d29A921EDd603F746CE')
    console.log(bytecode)

    const selectors = evmole.functionSelectors(bytecode)
    console.log(selectors)
    // // Output(list): [ '2125b65b', 'b69ef8a8' ]

    // console.log( functionArguments(code, '2125b65b') )
    // // Output(str): 'uint32,address,uint224'
  } catch (err) {
    console.log(err)
  }
}

getFunctionSelectors()