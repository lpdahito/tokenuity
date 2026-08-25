// docker run -it --rm --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/getRealHolderCount.js").default()'

// import { getHolderData, } from '../helpers/tokens.js'

// export default async () => {
//   try  {
//     const holders = await getHolderData(
//       '0x56389116A77b2e11728D58b478118E5AD11B162e',
//       [
//         '0xB18883Acd2C3c293501f1d91207B4b778D72de91',
//         '0xeBfc3A3531B13ceFA16B2D9D35de89399085fC37',
//         '0x61FfB1C812bA8B636674FaCf3E0e74439F7a1C2c',
//         '0x8a697C85DC43C822bbF48A31b0161D0b24CbFaF6',
//         '0x64bC900Aa1abc9B69C6A7c71809B2FCafc4F9Fea',
//         '0x45f2DCCd5Ec681656EA4C5957778dfCe381C4CF5'
//       ]
//     )

//     console.log(holders)
//   } catch (err: any)  {
//     if ('message' in err) {
//       console.log(err.message)
//     }
//   }
// }