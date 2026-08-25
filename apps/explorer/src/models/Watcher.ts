import { Schema, model } from 'mongoose'
import { IWatcher } from '../types.js'

const WatcherSchema = new Schema<IWatcher>({
  token: { type: String },
  event: { type: Number },
  createdAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  }
})

WatcherSchema.index({ address: 1 }, { unique: true })

const WatcherModel = model<IWatcher>('Watcher', WatcherSchema)
export { WatcherModel }