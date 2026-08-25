// import type { HydratedDocument } from 'mongoose'

// import { Logger } from '../config/logger.js'

// import * as models from '../models/models.js'

// import type { ISelector, IToken, SelectorData } from '../types.js'

// const {
//   SelectorModel: Selector
// } = models

// export const saveSelectorsForToken = async (
//   token: HydratedDocument<IToken>,
//   good: boolean
// ): Promise<void> => {
//   const time = Math.floor(Date.now() / 1000)

//   try {
//     if (token.selectors && token.selectors.length) {
//       for (let tokenSelector of token.selectors) {
//         let selector = await findOrCreateSelector(tokenSelector)
//         if (!selector) continue;

//         if (
//           good
//           && !selector.lastGoods?.includes(token.address)
//         ) {
//           if (selector.lastGoods) {
//             selector.lastGoods.push(token.address)
//           } else {
//             selector.lastGoods = [ token.address ]
//           }

//           if (selector.lastBads?.includes(token.address)) {
//             selector.lastBads = selector.lastBads.filter(t => t !== token.address)
//           }
          
//           selector.goodCount++
//           selector.lastGoodTime = time
//         } else if (
//           !good
//           && !selector.lastBads?.includes(token.address)
//         ) {
//           if (selector.lastBads) {
//             selector.lastBads.push(token.address)
//           } else {
//             selector.lastBads = [ token.address ]
//           }

//           if (selector.lastGoods?.includes(token.address)) {
//             selector.lastGoods = selector.lastGoods.filter(t => t !== token.address)
//           }
          
//           selector.badCount++
//           selector.lastBadTime = time
//         }

//         selector.updatedAt = Math.floor(Date.now() / 1000)
//         await selector.save()
//       }
//     }
//   } catch (err: any) {
//     Logger.err({ error: err, report: true })
//   }
// }

// export const getSelectorDataForToken = async (
//   token: HydratedDocument<IToken>,
// ): Promise<SelectorData> => {
//   const data = <SelectorData>{
//     oneLastWasBad: false,
//     unknown: [] as string[],
//     unallowed: [] as string[]
//   }

//   try {
//     if (token.selectors && token.selectors.length) {
//       for (let tokenSelector of token.selectors) {
//         let selector = await findOrCreateSelector(tokenSelector)

//         if (!selector) continue;
//         if (selector.body === 'd505accf') continue; // permit
//         if (selector.body === '8091f3bf') continue; // launched
//         if (selector.body === '01339c21') continue; // launch()

//         const goodCount = selector.goodCount ? selector.goodCount : 0
//         const badCount = selector.badCount ? selector.badCount : 0
//         const total = goodCount + badCount

//         let percentage = 0
//         if (total > 0) { percentage = badCount / total }

//         // console.log('Selector calculations...', 'good:', goodCount, 'bad:', badCount, 'total:', total, 'percentage:', percentage)

//         /* Fibonacci sequence
//           0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377,
//           610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657,
//           46368, 75025, 121393, 196418, 317811, 514229
//         */

//         switch (true) {
//           case (total > 3 && percentage > 0.4):
//           case (total > 8 && percentage > 0.34):
//           case (total > 21 && percentage > 0.28):
//             data.unallowed.push(selector.body); break;
//         }

//         // Contains unseen before selector
//         if (goodCount === 0 && badCount === 0) {
//           data.unknown.push(selector.body); continue;
//         }

//         if (!selector.lastGoodTime && selector.lastBadTime) {
//           data.oneLastWasBad = true; continue;
//         }

//         if (
//           selector.lastGoodTime
//           && selector.lastBadTime
//           && selector.lastGoodTime < selector.lastBadTime
//         ) {
//           data.oneLastWasBad = true
//         }
//       }
//     }
//   } catch (err: any) {
//     Logger.err({ error: err, report: true })
//   } finally {
//     return data
//   }
// }

// const findOrCreateSelector = async (
//   body: string
// ): Promise<HydratedDocument<ISelector> | null> => {
//   let selector: HydratedDocument<ISelector> | null = null

//   try {
//     selector = await Selector.findOne({ body: body })

//     if (!selector) {
//       selector = new Selector({ body: body })

//       await selector.save()
//     }
//   } catch (err: any) {
//     Logger.err({ error: err, report: true })
//   } finally {
//     return selector
//   }
// }