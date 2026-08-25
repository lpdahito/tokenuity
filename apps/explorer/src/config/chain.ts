// https://medium.com/thedarkside/block-time-across-major-blockchains-031a489f98b7

interface IChain {
  id: number
  name: string
  abbr: string
  publicNode: string
  blockSpread: number
  timePerBlock: number
}

const chain: IChain = {
  id: parseInt(process.env.CHAIN_ID || '1'),
  name: 'mainnet',
  abbr: 'main',
  publicNode: 'https://ethereum-rpc.publicnode.com',
  blockSpread: 2,
  timePerBlock: 2
}

switch (chain.id) {
  case 8453:
    chain.name = 'base'
    chain.abbr = 'base'
    chain.publicNode = 'https://base-rpc.publicnode.com'
    chain.blockSpread = 5 // average block time = 2.0s (2025-06-08)
    chain.timePerBlock = 2 // 2 seconds

    break;

  case 9745:
    chain.name = 'plasma'
    chain.abbr = 'plasma'
    chain.publicNode = 'https://base-rpc.publicnode.com'
    chain.blockSpread = 10 // average block time = 1.0s (2025-09-27)
    chain.timePerBlock = 1 // 1 second

    break;

  case 56:
    chain.name = 'bsc'
    chain.abbr = 'bsc'
    chain.publicNode = 'https://bsc-rpc.publicnode.com'
    chain.blockSpread = 14 // average block time = 0.75s
    chain.timePerBlock = 0.75 // 0.75 seconds

    break;

  case 11155111:
    chain.name = 'sepolia'
    chain.abbr = 'sep'
    chain.publicNode = 'https://ethereum-sepolia-rpc.publicnode.com'

    break;
}

export { chain }