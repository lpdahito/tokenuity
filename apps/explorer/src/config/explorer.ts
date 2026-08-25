import { chain } from './chain.js'

let explorer = {
  url: '',
  apiUrl: '',
  key: ''
}

switch (chain.id) {
  case 56:
    explorer.url = 'https://bscscan.com/'
    explorer.apiUrl = 'https://api.etherscan.io/v2/api?chainid=56'
    explorer.key = process.env.ETHERSCAN_API_KEY_TOKEN!
    break;

  case 8453:
    explorer.url = 'https://basescan.org/'
    explorer.apiUrl = 'https://api.etherscan.io/v2/api?chainid=8453'
    explorer.key = process.env.ETHERSCAN_API_KEY_TOKEN!
    break;
}

export default explorer