import { Schema, model } from 'mongoose'
import type { ISnippet } from '../types.js'

const SnippetSchema = new Schema<ISnippet>({
  body: { type: String },
  scope: { type: String },
  badStreak: { type: Number, default: 0 },
  tokens: { type: [String], default: [] },
  blocked: { type: Boolean, default: true },
  badTokens: { type: [String], default: [] },
  goodTokens: { type: [String], default: [] },
  badAmounts: { type: [Number], default: [] },
  trustScore: { type: Number, default: null },
  reviewed: { type: Boolean, default: false },
  goodAmounts: { type: [Number], default: [] },
  // lastSeen: { type: Number, default: () => Math.floor(Date.now() / 1000) },
  createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
})

SnippetSchema.index({ scope: 1, body: 1 }, { unique: true })

const SnippetModel = model<ISnippet>('Snippet', SnippetSchema)
export { SnippetModel }