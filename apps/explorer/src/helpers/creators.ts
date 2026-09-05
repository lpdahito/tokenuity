import type { HydratedDocument } from 'mongoose'

import { Logger } from '../config/logger.js'

import * as models from '@tokenuity/store'

import type { ICreator, } from '@tokenuity/types'

const {
  CreatorModel: Creator
} = models

export const findOrCreateCreator = async (
  address: string
): Promise<HydratedDocument<ICreator> | null> => {
  let creator: HydratedDocument<ICreator> | null = null

  try {
    creator = await Creator.findOne({
      address: address,
    })

    if (!creator) {
      creator = new Creator({
        failCount: 0,
        successCount: 0,
        address: address,
      })

      await creator.save()
    }
  } catch(err) {
    Logger.err({ error: err, report: true })
  } finally {
    return creator
  }
}

export const updateCreator = async (
  address: string,
  success: boolean
): Promise<boolean> => {
  let saved = false

    try {
      const creator = await Creator.findOne({
        address: address,
      })

      if (!creator) { return saved }

      if (success) {
        creator.successCount++

        saved = true
      } else {
        creator.failCount++
      }

      await creator.save()
  } catch(err) {
    Logger.err({ error: err, report: true })
  } finally {
    return saved
  }
}