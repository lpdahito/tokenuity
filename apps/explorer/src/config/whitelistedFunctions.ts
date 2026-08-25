export interface WhitelistObject {
  functions?: Array<string>
  members?: Array<string>
}

export interface WhitelistObjects {
  [key: string]: WhitelistObject
}

export const whitelistObjects = <WhitelistObjects>{
  _msgSender: {
    members: [
      'sender'
    ]
  },

  _msgData: {
    members: [
      'data'
    ]
  },

  allowance: {
    functions: [],
    members: [
      '_allowances',
      'spender'
    ]
  },

  approve: {
    functions: [
      '_approve',
      '_msgSender'
    ],
  },

  burn: {
    functions: [
      '_burn',
      '_msgSender',
      'address',
      'require',
      'Transfer'
    ],
  },

  decreaseAllowance: {
    functions: [
      '_approve',
      '_msgSender',
      'allowance',
      'require'
    ],
  },

  increaseAllowance: {
    functions: [
      '_approve',
      '_msgSender',
      'allowance',
      'require'
    ]
  },

  transfer: {
    functions: [ '_transfer' ]
  },

  transferFrom: {
    functions: [
      '	_afterTokenTransfer',
      '_approve',
      '_beforeTokenTransfer',
      '_msgSender',
      '_spendAllowance',
      '_transfer',
      'Approval',
      'require',
    ],

    members: [
      'sub'
    ]
  },

  _afterTokenTransfer: {},

  _approve: {
    functions: [
      '_approve',
      'address',
      'Approval'
    ],
  },

  _beforeTokenTransfer: {},

  _burn: {
    functions: [
      '_afterTokenTransfer',
      '_beforeTokenTransfer',
      '_msgSender',
      '_totalSupply',
      '_update',
      'address',
      'ERC20InvalidSender',
      'require',
      'Transfer'
    ],

    members: []
  },

  _mint: {
    functions: [
      '_afterTokenTransfer',
      '_beforeTokenTransfer',
      '_totalSupply',
      '_update',
      'address',
      'require',
      'Transfer'
    ],
  },

  _transfer: {
    functions: [
      '_afterTokenTransfer',
      '_beforeTokenTransfer',
      '_update',
      'address',
      'ERC20InvalidReceiver',
      'ERC20InvalidSender',
      'require',
      'Transfer'
    ],

    members: [
      'sub'
    ]
  },

  _spendAllowance: {
    functions: [
      '_approve',
      'allowance',
      'ERC20InsufficientAllowance',
      'require',
      'type'
    ],

    members: [
      'max', 'sub'
    ]
  },

  _update: {
    functions: [
      '_afterTokenTransfer',
      '_beforeTokenTransfer',
      'address',
      'ERC20InsufficientBalance',
      'require',
      'Transfer'
    ],

    members: [
      '_balances'
    ]
  }
}