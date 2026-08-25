export class Stat {
  arrAsc: Array<number>
  arrDesc: Array<number>

  sum: number = 0
  mean: number | null = null
  median: number | null = null
  modes: Array<number> | null = null

  variance: number | null = null
  sd: number | null = null
  sdLow: number | null = null
  sdHigh: number | null = null
  sdLow2X: number | null = null
  sdHigh2X: number | null = null

  iqr: number | null = null
  iqrLow: number | null = null
  iqrHigh: number | null = null
  iqrQ1: number | null = null
  iqrQ3: number | null = null

  lowest: number | null = null
  highest: number | null = null

  constructor(
    arr: Array<number>,
  ) {
    this.arrAsc = arr.slice(0).sort((a, b) => a - b)
    this.arrDesc = arr.slice(0).sort((a, b) => b - a)

    this.lowest = this.arrAsc[0]
    this.highest = this.arrAsc[this.arrAsc.length -1]

    this.computeMean()
    this.computeMedian()
    this.computeModes()
    this.computeSd()
    this.computeIqr()
  }

  computeMean(): void {
    const N = this.arrAsc.length

    for (let value of this.arrAsc) {
      this.sum += value
    }

    this.mean = this.sum / N
  }

  computeMedian(): void {
    this.median = this.calcMedian(this.arrAsc)
  }

  computeModes(): void {
    let maxCount = 0
    let modes: Array<number> = []

    const modeMap = new Map<number, number>()

    for (let num of this.arrAsc) {
      let count = modeMap.get(num) || 0
      modeMap.set(num, count + 1)

      if (count + 1 > maxCount) {
        maxCount = count + 1
        modes = [num]
      } else if (count + 1 === maxCount) {
        modes.push(num)
      }
    }

    this.modes = modes
  }

  computeSd(): void {
    if (!this.sum) return
    if (this.mean === null) return

    const N = this.arrAsc.length
  
    let sumOfSquares = 0
    for (let value of this.arrAsc) {
      sumOfSquares += (value - this.mean) ** 2
    }
  
    this.variance = sumOfSquares / N
  
    this.sd = Math.sqrt(this.variance)

    this.sdLow = this.mean - this.sd
    this.sdHigh = this.mean + this.sd

    this.sdLow2X = this.mean - (this.sd * 2)
    this.sdHigh2X = this.mean + (this.sd * 2)
  }

  computeIqr(): void {
    let q1Arr = []
    let q3Arr = []

    const splitIndex = Math.floor(this.arrAsc.length / 2)

    if (this.arrAsc.length % 2 === 0) {
      q1Arr = this.arrAsc.slice(0, splitIndex)
      q3Arr = this.arrAsc.slice(splitIndex, this.arrAsc.length)
    } else {
      q1Arr = this.arrAsc.slice(0, splitIndex)
      q3Arr = this.arrAsc.slice(splitIndex + 1, this.arrAsc.length)
    }

    const q1 = this.calcMedian(q1Arr)
    const q3 = this.calcMedian(q3Arr)
    const iqr = q3 - q1
    
    this.iqrHigh = q3 + (iqr * 1.5)
    this.iqrLow = q1 - (iqr * 1.5)
    this.iqrQ1 = q1
    this.iqrQ3 = q3
    this.iqr = iqr
  }

  calcMedian(
    arr: Array<number>
  ): number {
    let median = 0
    const middle = Math.floor(arr.length / 2)

    if (arr.length % 2 === 0) {
      median = (arr[middle - 1] + arr[middle]) / 2
    } else {
      median = arr[middle]
    }

    return median
  }
}