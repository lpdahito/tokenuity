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

export const getDexscreenerData = async (
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

  let url = `https://api.dexscreener.com/token-pairs/v1/${chain.name}/`
  url += tokenAddress

  let res: AxiosResponse<any, any> | null = null

  try {
    res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json"
      }
    })
    const data = res?.data

    // console.log(res?.data)

    if (typeof data === 'object') {
      for (const item of data) {
        if (item.pairCreatedAt) {
          if (!tokenData.createdAt) {
            tokenData.createdAt = item.pairCreatedAt
          } else {
            if (tokenData.createdAt > item.pairCreatedAt) {
              tokenData.createdAt = item.pairCreatedAt
            }
          }
        }

        const websites = item?.info?.websites
        if (typeof websites === 'object') {
          for (const website of websites) {

            // console.log(website)
            
            if (website.label === 'Website') {
              tokenData.website = website.url
            }

            if (website.label === 'github') {
              tokenData.github = website.url
            }
          }
        }

        const socials = item?.info?.socials
        if (typeof socials === 'object') {
          for (const social of socials) {
            if (social?.type === 'twitter') {
              tokenData.twitter = social.url
            }

            if (social?.type === 'telegram') {
              tokenData.telegram = social.url
            }

            if (social?.type === 'tiktok') {
              tokenData.tiktok = social.url
            }

            if (social?.type === 'discord') {
              tokenData.discord = social.url
            }
          }
        }

        const boosts = item?.boosts
        if (typeof boosts === 'object') {
          if (boosts.active) {
            tokenData.boosts += boosts.active
          }
        }
      }
    }

    if (tokenData.createdAt) {
      tokenData.createdAt = tokenData.createdAt / 1000
    }
  } catch (err: any) {
    console.log(err)
  } finally {
    return tokenData
  }
}

