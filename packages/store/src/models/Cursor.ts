import mongoose, { Schema } from 'mongoose'
import { CURSOR_TYPES, ICursor } from '@tokenuity/types'

const CursorSchema = new Schema<ICursor>(
  {
    type: { type: Number, enum: [...CURSOR_TYPES], required: true, unique: true },
    lastBlock: { type: Number, min: 0, required: true },
  },
  { timestamps: true }
)

export const CursorModel =
  (mongoose.models.Cursor as mongoose.Model<ICursor>) ??
  mongoose.model<ICursor>('Cursor', CursorSchema)