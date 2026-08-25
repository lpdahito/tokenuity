import axios, { AxiosResponse } from 'axios'

import { chain } from './../config/chain.js'

interface TokenData {
  twitter: string | null
  telegram: string | null
  tiktok: string | null
  discord: string | null
  github: string | null
  website: string | null
  boosts: number
  createdAt: number
}

export const getGeckoTerminalData = async (
  tokenAddress: string
): Promise<TokenData> => {
  let tokenData = <TokenData> {
    twitter: null,
    telegram: null,
    tiktok: null,
    discord: null,
    github: null,
    website: null,
    boosts: 0,
    createdAt: 0
  }

  let url = 'https://api.geckoterminal.com/api/v2'

  url += '/networks/' + chain.name
  url += '/tokens/' + tokenAddress + '/info'

  let res: AxiosResponse<any, any> | null = null

  try {
    res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json"
      }
    })
    const data = res?.data

    console.log(res?.data)

    if (typeof data === 'object') {
      console.log(data?.data?.attributes?.gt_score_details)
      // for (const item of data) {
      //   if (item.pairCreatedAt) {
      //     if (!tokenData.createdAt) {
      //       tokenData.createdAt = item.pairCreatedAt
      //     } else {
      //       if (tokenData.createdAt > item.pairCreatedAt) {
      //         tokenData.createdAt = item.pairCreatedAt
      //       }
      //     }
      //   }

        // const websites = item?.info?.websites
        // if (typeof websites === 'object') {
        //   for (const website of websites) {

        //     // console.log(website)
            
        //     if (website.label === 'Website') {
        //       tokenData.website = website.url
        //     }

        //     if (website.label === 'github') {
        //       tokenData.github = website.url
        //     }
        //   }
        // }
      // }
    }
  } catch (err: any) {
    console.log(err)
  } finally {
    return tokenData
  }
}

