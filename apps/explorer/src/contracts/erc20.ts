import erc20 from './abis/openzeppelin/ERC20.json' // assert { type: 'json' }
import ownable from './abis/openzeppelin/Ownable.json' // assert { type: 'json' }

import { id } from 'ethers'

// Reference:
// https://docs.openzeppelin.com/contracts/4.x/api/token/erc20
// https://docs.openzeppelin.com/contracts/5.x/api/token/erc20

const base = [
  // ERC20

  '06fdde03', // function name()
  '95d89b41', // function symbol()
  '313ce567', // function decimals()
  '18160ddd', // function totalSupply()
  '70a08231', // function balanceOf(address owner)
  'a9059cbb', // function transfer(address to, uint value)
  '23b872dd', // function transferFrom(address from, address to, uint value)
  '095ea7b3', // function approve(address spender, uint value)
  'dd62ed3e', // function allowance(address owner, address spender)
  '39509351', // function increaseAllowance(address spender, uint256 addedValue)
  'a457c2d7', // function decreaseAllowance(address spender, uint256 subtractedValue)

  // ERC20Permit

  // 'd505accf', // function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  '7ecebe00', // function nonces(address)
  '3644e515', // function DOMAIN_SEPARATOR()

  // ERC20Burnable

  '42966c68', // function burn(uint256 value)
  '79cc6790', // function burnFrom(address account, uint256 value)
]

const permitted = [
  '8da5cb5b', // function owner()
  '715018a6', // function renounceOwnership()
  'f2fde38b', // function transferOwnership(address newOwner)

  // '8091f3bf', // launched
  // '01339c21', // function launch()
]

const unwanted = [
  '4f7041a5', // buyTax
  'cc1776d3', // sellTax

  '0ac71193', // startTx

  '0faee56f', // _maxTaxSwap
  '7d1db4a5', // _maxTxAmount
  '8f9a55c0', // _maxWalletSize
  'bf474bed', // _taxSwapThreshold

  '4d237730', // taxManager
  '771a3a1d', // taxRate
  '37bb0eb8', // function reduceTaxRate(address account, uint256 newTaxRate)

  'f7888aec', // function balanceOf(address from, address to)

  '19ab453c', // function init(address init_0x)

  '033b9b4f', // function tokenSymbol(address account)
  '97541e9f', // function multicall(address spender)

  '884e01d7', // ekvezobv
  'c22b21cc', // yazrjatq
  '927f3d41', // _defaultAddress ????

  '18647744', // function permit(address tokenOwner, address spender, uint256 amount)

  '19693acd', // function validateAllowance(address owner, address spender, uint256 addedValue)
]

export default {
  abi: erc20.abi.concat(ownable.abi),
  selectors: {
    base: base,
    permitted: permitted,
    unwanted: unwanted
  },
  transferSignature: id("Transfer(address,address,uint256)")
}