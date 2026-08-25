// import { performance } from 'perf_hooks'

// import * as mongoose from 'mongoose'

// import * as models from '../../models/models.js'

// import { databaseUrl } from '../../config/databaseUrl.js'

// // import { handleSwapMovementForToken } from '../../helpers/tokenswaps.js'

// const {
//   TokenModel: Token,
// } = models

// import { SwapMovementForToken } from '../../types.js'

// export default async (
// ): Promise<void> => {
//   let _time = performance.now()

//   let promises: Array<Promise<SwapMovementForToken>> = []

//   const ceiling = Math.floor(Date.now() / 1000)
//   const floor = ceiling - (60 * 30) // 30 mins ago.

//   const twoHoursAgo = ceiling - (2 * 60 * 60) // 2 hours ago.
//   const oneDayAgo = ceiling - (60 * 60 * 24) // 1 day ago.
//   const oneWeekAgo = ceiling - (60 * 60 * 24 * 7) // 1 week ago.

//   const interval = 60 * 5 // 5 minutes.

//   try {
//     mongoose.set('strictQuery', false)
//     await mongoose.connect(databaseUrl)

//     let tokens = await Token.find({
//       follow: true,
//       lastSwap: { $gt: ceiling - interval }
//     })

//     if (!tokens.length) return

//     for (let token of tokens) {
//       promises.push(
//         handleSwapMovementForToken(
//           token, ceiling, floor, twoHoursAgo, oneDayAgo, oneWeekAgo
//         )
//       )
//     }

//     if (promises.length) {
//       await Promise.all(promises)
//     }
//   } catch(err: any) {
//     console.log(err.message)
//   } finally {
//     mongoose.disconnect()
//     console.log(`Movement: ${(performance.now() - _time).toFixed(2)}ms`)
//   }
// }