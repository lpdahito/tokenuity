import aggregatorV3InterfaceAbi from './abis/chainlink/AggregatorV3Interface.json' // assert { type: 'json' }

let chainlink = {
  aggregatorV3: {
    address: '',
    abi: aggregatorV3InterfaceAbi
  }
}

export { chainlink }