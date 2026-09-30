import type { HydratedDocument } from 'mongoose'
import { CheckTypes, ICheck } from '@tokenuity/types'

export const formatCheck = (check: HydratedDocument<ICheck>) => {
  const { _id, __v, type, createdAt, execTime, ...rest } = check.toObject()

  return {
    type: CheckTypes[type],
    createdAt: createdAt.toLocaleString('en-US', {
      timeZone: 'America/Toronto',
      dateStyle: 'medium',
      timeStyle: 'medium',
    }),
    execTime: `${execTime}s`,
    ...rest,
  }
}
