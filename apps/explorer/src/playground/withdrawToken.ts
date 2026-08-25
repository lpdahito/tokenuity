// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/withdrawToken.js").default()'

import { ethers } from 'ethers'

import addresses from '../config/addresses'
import { contracts } from '../contracts/contracts'

import { providers, wallets } from '../config/provider'

export default async () => {
  const token = '0x12e89C9D8f2FDE6327af276B2AE0E57665Fb451a'

  const defaultContract = new ethers.Contract(
    addresses.tokenuity, contracts.tokenuity.abi, wallets[0]
  )

  const calldata = defaultContract.interface.encodeFunctionData(
    'withdrawToken', [token]
  )

  try {
    const feeData = await providers[0].getFeeData()

    let maxFeePerGas = feeData['maxFeePerGas']
    let maxPriorityFeePerGas = feeData['maxPriorityFeePerGas']

    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      console.log('Gas fee data is missing'); return
    }

    let txParams = {
      from: wallets[0].address,
      to: addresses.tokenuity,
      data: calldata,
      value: 0,
      chainId: 8453,
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      gasLimit: BigInt(2000000)
    }

    const tx = await wallets[0].sendTransaction(txParams)
    await tx.wait()
  } catch(err: any) {
    console.log(err)
  }
}