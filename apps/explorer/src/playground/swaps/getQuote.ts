// // docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/swaps/getQuote.js").default()'

// import { providers, wallets } from './../../config/provider.js'

// import { Swap } from './../../helpers/swaps.js'

// import { DexProtocols, Routers } from './../../types.js'

// export default async () => {
//   const router = Routers.default

//   const tokenAddress = '0x9536A8b08D3738F6f9a37Acd6ab88e8a6ccD3E94'

//   const swapParams = {
//       buy: true,
//       fee: 3000,
//       router: router,
//       amountIn: 447479709582591n,
//       signer: wallets[0],
//       token: tokenAddress,
//       protocol: DexProtocols.uniswapv3
//     }

//     const swap = new Swap(swapParams)
    

//   try {
//     const amountOut = await swap.quote()
//     // const calldata = await swap.encode()

//     console.log(amountOut)
//   } catch (err: any) {
//     console.log(err)
//   }
// }