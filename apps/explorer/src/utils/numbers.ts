import { BigNumber } from 'bignumber.js'

export const growth = (
  book: string,
  market: string
): { value: string, positive: number } => {
  let growth = BigNumber(0)
  let positive = 0

  if (BigNumber(book).eq(0)) {
    return { value: '0.00', positive: positive }
  }
  if (BigNumber(market).eq(0)) {
    return { value: '100.00', positive: -1 }
  }

  if (BigNumber(market).gt(book)) {
    growth = ((BigNumber(market).minus(book)).div(book)).times(100)
    positive = 1
  }

  if (BigNumber(market).lt(book)) {
    growth = ((BigNumber(book).minus(market)).div(book)).times(100)
    positive = -1
  }

  // if (growth.gt(1000)) {
  //   console.log('growth', growth.toFixed())
  // }

  return { value: growth.toFixed(2), positive: positive }
}

export const priceInUsd = (
  lastPriceInBase: string,
  ethPrice: string,
): string => {
  if (BigNumber(lastPriceInBase).eq(0)) return '0.00'
  if (BigNumber(ethPrice).eq(0)) return '0.00'

  return BigNumber(lastPriceInBase).div(BigNumber(ethPrice)).toFixed()
}

export const balanceInUsd = (
  balance: string,
  priceInUsd: string,
  decimals: number,
): string => {
  if (BigNumber(balance).eq(0)) return '0.00'
  if (BigNumber(priceInUsd).eq(0)) return '0.00'

  let _balance = BigNumber(balance).div(10 ** decimals)

  return (_balance.times(BigNumber(priceInUsd))).toFixed()
}