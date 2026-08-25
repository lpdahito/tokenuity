import { Schema, model } from 'mongoose'
import { INotification } from '../types.js'

const NotificationSchema = new Schema<INotification>({
  notificationType: {
    type: String, // totalSwapCount, tokenSwapCount
    required: true,
  },
  token: { type: String },
  pump: { type: Boolean },
  swapCount: { type: Number },
  createdAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  },
})

const NotificationModel = model<INotification>('Notification', NotificationSchema)
export { NotificationModel }