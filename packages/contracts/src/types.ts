export enum Launchpads {
  unknown   = 0,

  virtuals  = 1,
  toshimart = 2,
  apestore  = 3,
  fourmeme  = 4,
  clanker   = 5,
  zora      = 6
}

export interface IToken {
  name: string
  block: number
  symbol: string
  address: string
  follow: boolean
  decimals: number
  logIndex: number
  buyCount: number
  lastSwap: number
  swapCount: number
  sellCount: number
  createdAt: number
  totalSupply: string
  website: string | null
  isScam: boolean | null
  creator: string | null
  verified: boolean | null
  compliant: boolean | null
  snippetSafe: boolean | null
  launchpad: Launchpads | null
  ownerRenounced: boolean | null
  // protocols: Array<DexProtocols>
}