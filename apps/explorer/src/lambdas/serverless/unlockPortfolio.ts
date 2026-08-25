// import * as mongoose from 'mongoose'

// import * as models from '../../models/models'

// import { databaseUrl } from '../../config/databaseUrl'

// const { PortfolioModel: Portfolio } = models

// export default async (): Promise<void> => {
//   const now = Math.floor(Date.now() / 1000)

//   try {
//     mongoose.set('strictQuery', false)
//     await mongoose.connect(databaseUrl)

//     let portfolios = await Portfolio.find({})
//     for (let portfolio of portfolios) {
//       if (portfolio.locked.length === 0) continue
//       if (portfolio.updatedAt > (now - (30 * 60))) continue

//       portfolio.locked = []
//       await portfolio.save()

//       console.log('Unlocked portfolio.')
//     }
//   } catch (err: any) {
//     console.log(err.message)
//   } finally {
//     mongoose.disconnect()
//   }
// }