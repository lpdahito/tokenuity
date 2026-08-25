// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/launchpads/decodeTx.js").default()'

import { ethers } from 'ethers'

export default async () => {
  // ABI of the function you're decoding
  const abi = [ "function buy(address,uint256,uint256,bytes)" ]
  const iface = new ethers.Interface(abi)

  const inputData = '0x6c025572000000000000000000000000adb86d5ddc64d4bdbe52b3b49580f1d54991762800000000000000000000000000000000000000000000000000354a6ba7a1800000000000000000000000000000000000000000000000ba460c01aa0c05d1437800000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000041db7b9d81813e31083ad32e5370ae92f6aa4d4b79c278f3e438719a31898cf9e727c1206adb1420b78963f7824994d30d2543ee17174d42ab2f3c958060d4ebee1b00000000000000000000000000000000000000000000000000000000000000'

  try {
    console.log('decoding tx...')

    // Decode
    const decoded = iface.decodeFunctionData("buy", inputData);
    console.log(decoded);
  } catch (err: any) {
    console.log(err)
  }
}