import { BigNumber } from 'bignumber.js'

export const human = (
  amount: string,
  whole?: boolean,
  decimals?: number,
): string => {
  if (BigNumber(amount).eq(0)) return '0.00'

  let number = '0.00'
  number = BigNumber(amount).toFixed()

  if (decimals) {
    number = BigNumber(amount).div(10 ** decimals).toFixed()
  }

  if (BigNumber(number).gte(1)) {
    let _whole = number.split('.')[0]
    let fractional: string | undefined = number.split('.')[1]

    if (!fractional) fractional = '00'
    if (fractional.length < 2) fractional = fractional + '0'

    if (_whole.length > 3) {
      _whole = _whole.split('').reverse().reduce((acc: Array<string>, curr, index) => {
        if (index > 0 && index % 3 === 0) acc.push(',')
        acc.push(curr)
        return acc
      }, []).reverse().join('')
    }

    number = _whole
    if (!whole) {
      number += '.' + fractional.slice(0, 2)
    }
  } else {
    let arr = number.slice(2).split('')

    let zeros = 0
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === '0') {
        zeros++
      } else {
        break
      }
    }

    number = BigNumber(number).toFixed(zeros + 2)
  }

  return number
}

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
    growth = ((BigNumber(market).minus(book)).div(book)).times(100); positive = 1;
  }

  if (BigNumber(market).lt(book)) {
    growth = ((BigNumber(book).minus(market)).div(book)).times(100); positive = -1;
  }

  // if (growth.gt(1000)) {
  //   console.log('growth', growth.toFixed())
  // }

  return { value: growth.toFixed(2), positive: positive }
}

export const priceInUsd = (
  lastPriceInBase: string,
  baseTokenPrice: string,
): string => {
  if (BigNumber(lastPriceInBase).eq(0)) return '0.00'
  if (BigNumber(baseTokenPrice).eq(0)) return '0.00'

  return BigNumber(lastPriceInBase).div(BigNumber(baseTokenPrice)).toFixed()
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

export const elapsed = (
  time: number | undefined
): string => {
  if (time === undefined) return ""

  let seconds = Math.floor(Date.now() / 1000) - time

  if (seconds < 60) {
    return 'just now'
  } else if (seconds >= 60 && seconds < 3600) {
    let mins = Math.floor(seconds / 60)
    return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`
  } else if (seconds >= 3600 && seconds < 86400) {
    let hours = Math.floor(seconds / (60 * 60))
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else {
    let days = Math.floor(seconds / (60 * 60 * 24))
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }
}

export const shrinkAddress = (
  address: string,
  length?: number
): string => {
  if (address === '0') return '0x'
  if (!length) length = 32
  return `${address.slice(0, 2)}...${address.slice(-(length - 2))}`
}

export const capitalize = (
  str: string
): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}