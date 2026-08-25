// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/dexscreener/getToken.js").default()'

import { getDexscreenerData } from "./../../helpers/dexscreener"

export default async () => {
  let a = '0x75092389463267670F4aA3b895A5F68FB3e27efB'
  a = '0x31fEbDE11a20c4CFe809F1C0943d02789C9146f4'
  // tokenAddress = '0x6043CcC02De06c77266BEC0E1B85Df92b1B26d7d'
  a = '0x19dfb61DebC727b8b604d4F556dbb3DC4330B196'
  a = '0x341eB090505a835B210c7dD0C8E00C15D93b334A'
  a = '0x41b8e9729bEf43a1311A0F22C5131915fdb16647'
  // a = '0xDF7035cFB267B201cA7B7e9EBe47186d548c5B07'
  // a = '0x1359622117a319E23402c316e611E0030471bB07'
  // a = '0x1B99E10aF2acFA0c12eB090e99741079E861979C'
  // a = '0x1656d5B9F63eb7502f42bA60119F79aA3Fa5A0c0'
  // a = '0x3836871C438D5310BDC690dF4D92938a6d032Eb2'
  // a = '0x54c9dc62453eCF5ff33f94B24dCAd1AE8e8650aB'
  // a = '0x4Cc5C4C25Bf534a1abc34B424F8440404EFfFB07'
  a = '0xAb4454b76aA28C43de878f38464A137122448345'
  a = '0x43d6e637de64F23271a271B9761479b12CcB8673'

  try {
    const dexscreenerData = await getDexscreenerData(
      a
    )

    console.log(dexscreenerData)
  } catch (err: any) {
    console.log(err)
  }
}

