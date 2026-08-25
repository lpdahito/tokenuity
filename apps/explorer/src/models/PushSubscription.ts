import { Schema, model } from 'mongoose'
import { IPushSubscription } from '../types.js'

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  subscriber_token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  },
})

const PushSubscriptionModel = model<IPushSubscription>('PushSubscription', PushSubscriptionSchema)
export { PushSubscriptionModel }