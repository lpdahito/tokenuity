import * as mongoose from 'mongoose'
import parser from '@solidity-parser/parser'

import * as models from './../../models/models.js'

import addresses from './../../config/addresses.js'
import { databaseUrl } from './../../config/databaseUrl.js'

import { getTokenSourceCode } from './../../helpers/tokens.js'
import { findOrCreateSnippet, getSourceCodeDataForFunctions } from './../../helpers/snippets.js'


const {
  TokenModel: Token,
} = models

export default async (
  event: any
): Promise<void> => {
  const tokenAddress = event.queryStringParameters?.tokenAddress
  if (!tokenAddress) { return }

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(databaseUrl, { autoIndex: false })

    const token = await Token.findOne({ address: tokenAddress })
    if (!token) { return }

    let tokenSourceCode = await getTokenSourceCode(token.address)
    if (!tokenSourceCode.length) { return }

    // Ask LLM which function could be injected with bad actors

    let _functions: string[] = []

    const sourceCodeData = getSourceCodeDataForFunctions(
      tokenSourceCode, _functions
    )
    
    if (!sourceCodeData) { return }

    // Find or create snippets
    for (let snippet of sourceCodeData.snippets) {
      let _snippet = await findOrCreateSnippet(
        token.address, snippet.scope, snippet.body, true
      )
    }
  } catch (err: any) {
    console.log(err.message)
  } finally {
    await mongoose.disconnect()
  }
}