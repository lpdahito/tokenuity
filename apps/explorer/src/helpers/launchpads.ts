import axios, { AxiosResponse } from 'axios'

import { chain } from './../config/chain.js'

export const isFourMeme = async (
  tokenAddress: string
): Promise<boolean> => {
  let _isFourMeme = false
  const url = `https://four.meme/meme-api/v1/private/token/get/v2?address=${tokenAddress}`

  let res: AxiosResponse<any, any> | null = null
  
  try {
    res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0 Safari/537.36',
        'Accept': 'application/json',
      }
    })

    // console.log(res?.data?.data)

    if (
      res?.status === 200
      && res?.data?.data
    ) {
      _isFourMeme = true
    }
  } catch (err: any) {
    if (err?.response?.status !== 404) {
      console.log(err)
    }
  } finally {
    return _isFourMeme
  }
}

export const isApeStore = async (
  tokenAddress: string
): Promise<boolean> => {
  let _isApeStore = false
  const url = `https://ape.store/api/token/${chain.name}/${tokenAddress}`

  let res: AxiosResponse<any, any> | null = null
  
  try {
    res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0 Safari/537.36',
        'Accept': 'application/json',
      }
    })

    if (res?.status === 200) {
      _isApeStore = true
    }
  } catch (err: any) {
    if (err?.response?.status !== 404) {
      console.log(err)
    }
  } finally {
    return _isApeStore
  }
}