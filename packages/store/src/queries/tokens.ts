// packages/store/src/queries/tokens.ts
import type { IToken } from '@tokenuity/contracts'
import { connect } from '../client'
import { TokenModel } from '../models/Token'

/** Fields excluded from every read — Mongo internals that don't serialize. */
const PUBLIC = { _id: 0, __v: 0 } as const

export async function getToken(
  // chainId: number,
  address: string
): Promise<IToken | null> {
  await connect()

  return TokenModel.findOne(
    {
      // chainId,
      address: address // .toLowerCase()
    },
    PUBLIC
  ).lean<IToken>()
}

export async function getTokens(
  // chainId: number,
  opts: { limit?: number; cursor?: number; scamOnly?: boolean } = {}
): Promise<IToken[]> {
  await connect()

  return TokenModel.find(
    {
      // chainId,
      follow: true,
      ...(opts.scamOnly && { isScam: true }),
      ...(opts.cursor && { createdAt: { $lt: opts.cursor } }),
    },
    PUBLIC
  )
    .sort({ createdAt: -1 })
    .limit(opts.limit ?? 50)
    .lean<IToken[]>()
}

// export async function upsertToken(token: Partial<IToken> & { chainId: number; address: string }) {
//   await connect()

//   await TokenModel.updateOne(
//     { chainId: token.chainId, address: token.address.toLowerCase() },
//     { $set: token },
//     { upsert: true }
//   )
// }