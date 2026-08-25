import { ethers } from 'ethers'
import parser from '@solidity-parser/parser'
import type { HydratedDocument } from 'mongoose'

import { Logger } from '../config/logger.js'
import { whitelistObjects, WhitelistObject } from '../config/whitelistedFunctions.js'

import { getSnippetTrustScore } from './../helpers/ai.js'

import { contracts } from '../contracts/contracts.js'

import * as models from '../models/models.js'

import type { ISnippet } from '../types.js'

interface Snippet {
  scope: string
  body: string
}

interface SourceCodeData {
  snippets: Snippet[]
  callableSelectors: string[]
}

const {
  SnippetModel: Snippet
} = models

export const findOrCreateSnippet = async (
  token: string,
  scope: string,
  body: string,
  block: boolean = false
): Promise<HydratedDocument<ISnippet> | null> => {
  let snippet: HydratedDocument<ISnippet> | null = null

  try {
    snippet = await Snippet.findOne({
      scope: scope, body: body
    })
    
    if (!snippet) {
      const trustScore = await getSnippetTrustScore(body)

      // if (trustScore < minTrustScore) { block = true }
      
      snippet = new Snippet({
        body: body,
        scope: scope,
        badTokens: [],
        goodTokens: [],
        // blocked: block,
        badAmounts: [],
        goodAmounts: [],
        reviewed: false,
        tokens: [ token ],
        trustScore: trustScore,
      })

      await snippet.save()
    }
  } catch(err) {
    Logger.err({ error: err, report: true })
  } finally {
    return snippet
  }
}

export const saveSnippetsForToken = async (
  token: string,
  amount: number,
  good: boolean
): Promise<void> => {
  try {
    let snippets = await Snippet.find({ tokens: token })

    for (let snippet of snippets) {
      await updateSnippetData(token, snippet, amount, good)
    }
    
  } catch(err) {
    Logger.err({ error: err, report: true })
  }
}

const updateSnippetData = async (
  token: string,
  snippet: HydratedDocument<ISnippet>,
  amount: number,
  good: boolean
): Promise<void> => {
  try {
    const badIndex = snippet.badTokens.indexOf(token)
    const goodIndex = snippet.goodTokens.indexOf(token)

    if (good) {
      snippet.badStreak = 0

      if (badIndex !== -1) {
        // remove from bad tokens...
        let badTokens = snippet.badTokens
        badTokens.splice(badIndex, 1)

        // remove amount from bad amounts
        let badAmounts = snippet.badAmounts
        badAmounts.splice(badIndex, 1)

        snippet.badTokens = badTokens
        snippet.badAmounts = badAmounts
      }

      if (goodIndex === -1) {
        snippet.goodTokens.unshift(token)
        snippet.goodAmounts.unshift(amount)
      }

      if (!snippet.reviewed) { snippet.blocked = false }
    } else {
      if (badIndex === -1 && goodIndex === -1) {
        snippet.badStreak++

        snippet.badTokens.unshift(token)
        snippet.badAmounts.unshift(amount)

        if (
          !snippet.reviewed
          && snippet.badStreak > 0
        ) {
          snippet.blocked = true
        }
      }
    }

    await snippet.save()
  } catch(err) {
    Logger.err({ error: err, report: true })
  }
}

export const maxAmountForSnippets = (
  snippets: Array<HydratedDocument<ISnippet>>,
  amount: number
): number => {
  if (!snippets || !snippets.length) { return 100 }

  let amounts: number[] = []
  for (let snippet of snippets) {
    const _amount = maxAmountForSnippet(
      snippet, amount
    )
    amounts.push(_amount)
  }

  // Return smallest value
  amounts = amounts.sort((a, b) => a - b)
  return amounts[0]
}

const maxAmountForSnippet = (
  snippet: HydratedDocument<ISnippet>,
  amount: number
): number => {
  if (snippet.reviewed && !snippet.blocked) { return amount }

  if (
    !snippet.badAmounts.length
    && !snippet.goodAmounts.length
  ) {
    return 0.25
  } else {
    return amount
  }
}

export const getSourceCodeDataForFunctions = (
  code: string,
  _functions: string[]
): SourceCodeData | null => {
  let sourceCodeData: SourceCodeData = {
    snippets: [], callableSelectors: []
  }
  
  try {

  } catch (err: any)  {
    return null // Can't parse
  } finally {
    return sourceCodeData
  }
}

export const getSourceCodeData = (
  code: string
): SourceCodeData | null => {
  let sourceCodeData: SourceCodeData = {
    snippets: [], callableSelectors: []
  }

  let signatures: string[] = []

  let erc20Selectors = contracts.erc20.selectors.base
  erc20Selectors = erc20Selectors.concat(contracts.erc20.selectors.permitted)

  // console.log(code)

  try  {
    let input = ""

    if (code.substring(0,2) === "{{") {
      code = code.slice(1, code.length -1)

      let sources = JSON.parse(code).sources

      for (let key in sources) {
        input += sources[key].content
      }
    } else if (code.substring(0,1) === "{") {
      let parsedCode = JSON.parse(code)

      for (let key in parsedCode) {
        input += parsedCode[key].content
      }
    } else {
      // 0x7A226B9A2d01bdB2FEe8D69c3181E1f6E25C6a66
      input = code
    }

    const ast = parser.parse(
      input, { loc: true }
    )

    parser.visit(ast, {
      FunctionDefinition: function (node) {
        let snippets: Snippet[] = []

        let externalOrPublic = (
          node.name
          && (
            node.visibility === 'external'
            || node.visibility === 'public'
          )
        );

        let mutable = (
          node.name
          && node.stateMutability === null
        );

        let viewable = (
          node.name
          && node.stateMutability === 'view'
        )

        // console.log(viewable)

        // console.log('externalOrPublic', externalOrPublic)
        // console.log('name:', node.name)
        // console.log('--')

        if (
          node.name
          && (
            node.visibility === 'external'
            || node.visibility === 'public'
          )
        ) {
          let funcString = node.name
          funcString += "("

          let _params = node.parameters

          if (_params && _params.length) {
            for (let i = 0; i < _params.length; i++) {
              const _object = _params[i].typeName
              if (!_object) { continue }

              if ('name' in _object) { funcString += _object.name }
              if (i < _params.length - 1) { funcString += ","}
            }
          }

          funcString += ")"

          const selector = ethers.id(funcString).substring(2, 10)
          if (!erc20Selectors.includes(selector)) {
            sourceCodeData.callableSelectors.push(selector)
            // console.log(node)
          }
        }

        // console.log(node)

        switch(true) {
          case (node.isConstructor):
            snippets = constructorIsSafe(input, node);
            
            break;

          case (node.name === 'mint'):
          case (node.name === 'name'):
          case (node.name === 'owner'):
          case (node.name === 'approve'):
          case (node.name === 'transfer'):
          case (node.name === 'burnFrom'):
          case (node.name === 'symbol'):
          case (node.name === 'decimals'):
          case (node.name === 'balanceOf'):
          case (node.name === 'totalSupply'):
          case (node.name === 'transferOwnership'):
          case (node.name === 'renounceOwnership'):
            // Skip for now...

            break;
          
          case (node.name === 'burn'):
          case (node.name === '_burn'):
          case (node.name === 'launch'):
          case (node.name === '_update'):
          case (node.name === 'allowance'):
          case (node.name === '_spendAllowance'):
          case (node.name === 'increaseAllowance'):
          case (node.name === 'decreaseAllowance'):
            snippets = detectUnknownSnippets(
              node.name, input, node
            );
            
            break;

          case (node.name === '_transfer'):
          case (node.name === 'transferFrom'):
            snippets = detectUnknownSnippets(
              node.name, input, node, {
                allowAssembly: false
              }
            );
            
            break;

          case (node.name === 'max'):
          case (node.name === 'min'):
          case (node.name === 'average'):

          case (node.name === 'add'):
          case (node.name === 'sub'):
          case (node.name === 'mul'):
          case (node.name === 'div'):
          case (node.name === 'mod'):

          case (node.name === 'tryAdd'):
          case (node.name === 'trySub'):
          case (node.name === 'tryMul'):
          case (node.name === 'tryDiv'):
          case (node.name === 'tryMod'):

          case (node.name === 'ceilDiv'):

          case (node.name === 'toUint168'):
          case (node.name === 'toUint176'):
          case (node.name === 'toUint184'):
          case (node.name === 'toUint192'):
          case (node.name === 'toUint200'):
          case (node.name === 'toUint208'):
          case (node.name === 'toUint216'):
          case (node.name === 'toUint224'):
          case (node.name === 'toUint232'):
          case (node.name === 'toUint240'):
          case (node.name === 'toUint248'):
          case (node.name === 'toUint256'):
            snippets = detectUnknownSnippets(
              node.name, input, node, {
                allowAssembly: false,
                mustBePure: true
              }
            )

            break;

          case (node.name === 'recover'):
          case (node.name === 'tryRecover'):
            snippets = detectUnknownSnippets(
              node.name, input, node, { mustBePure: true }
            )

            break;

          case(node.name === '_afterTokenTransfer'):
          case(node.name === '_beforeTokenTransfer'):
          case (node.name && externalOrPublic && mutable):
            snippets = detectUnknownSnippets(
              node.name, input, node, {
                nonStandard: true,
                allowAssembly: false
              }
            )
            
            break;

          case (node.name && viewable):
            snippets = detectUnknownSnippets(
              node.name, input, node, {
                nonStandard: true,
                // allowAssembly: false
              }
            )
            
            break;
        }

        for (let snippet of snippets) {
          if (!sourceCodeData.snippets.some(item => item.body === snippet.body)) {
            sourceCodeData.snippets.push(snippet)
          }
        }
      }
    })
    // console.log(checks)
  } catch (err: any)  {
    // console.log(err)
    return null // Can't parse
  } finally {
    return sourceCodeData
  }
}

const constructorIsSafe = (
  code: string,
  node: any
): Snippet[] => {
  let snippets: Snippet[] = []

  try {
    /**
     * No assembly statement allowed:
     * 0xFAfa08db99e0433fD9d99891b736f095feEA42fB
     * 0x7b7796E3B9fc89445819219AB6c5F7c43f5F32e0
     */

    parser.visit(node, {
      InlineAssemblyStatement: function () {
        const extractedCode = extractCodeFromLoc(code, node.loc)
        snippets.push({ scope: 'constructor', body: extractedCode })

        return snippets
      },

      FunctionCall: function (node1: any) {
        if (node1?.expression?.name === '_setObserver') {
          const extractedCode = extractCodeFromLoc(code, node.loc)
          snippets.push({ scope: 'constructor', body: extractedCode })

          return snippets
        }
      }
    })

    /**
     * No _setObserver call allowed:
     * 0xb04ec891acb76bb0c87ff66a869e4F4b975711bF
     */
  } catch(err: any) {
    Logger.err({ error: err, report: true })
  } finally {
    return snippets
  }
}

// const allowanceIsSafe = (
//   node: any
// ): string[] => {
//   let snippets: string[] = []

//   // console.log(node)

//   try {
//     /**
//      * 
//      * No operation allowed
//      * 0x483413B345ee0F1a25714fc0f77925769433c111
//      */

//     parser.visit(node, {
//       MemberAccess: function (node1: any) {
//         switch(true) {
//           case(node1?.memberName === 'mulDiv'):
//             snippets.push('allowance: mulDiv call')
//             break;
//         }
//       }
//     })
//   } catch(err: any) {
//     Logger.err({ error: err, report: true })
//   } finally {
//     return snippets
//   }
// }

// const _approveIsSafe = (
//   node: any
// ): Snippet[] => {
//   let snippets: Snippet[] = []

//   const whitelist = [
//     '_approve',
//     '_allowances',
//     'Approval'
//   ]
// }

const extractCodeFromLoc = (
  code: string,
  loc: any
): string => {
  // console.log(code)

  let lines = code.split("\n")
  if (!lines.length) { lines = code.split("\n") }

  // console.log(lines)

  let _code = lines.slice(loc.start.line - 1, loc.end.line)

  // console.log(_code)

  let cleaned: string[] = []
  for (let line of _code) {
    if (!line.match(/^\s*\/\//)) { cleaned.push(line) }
  }

  // _code = _code.filter((line) => {
  //   // Remove comments
  //   // return !(line.match(/\/\/.*$/gm) || line.match(/\/\*[\s\S]*?\*\//g))
  //   return !(line.match(/\/\/.*$/gm))
  // })

  return cleaned
    .join("\n")
    .replace(/\s{2,}/g, ' ')
    .trim()
}

type Options = {
  mustBePure?: boolean
  nonStandard?: boolean
  allowAssembly?: boolean
}

const detectUnknownSnippets = (
  functionName: string,
  code: string,
  node: any,
  opts?: Options
): Snippet[] => {
  let snippets: Snippet[] = []

  try {
    const whitelistObj: WhitelistObject | undefined = whitelistObjects[functionName as keyof typeof whitelistObjects]

    let whitelistedFunctions = whitelistObj?.functions
    let whitelistedMembers = whitelistObj?.members

    if (opts && opts.nonStandard === true) {
      whitelistedFunctions = []
    }

    parser.visit(node, {
      FunctionCall: function (childNode: any) {
        const name0: string | undefined = childNode?.expression?.name
        const name1: string | undefined = childNode?.expression?.expression?.name

        // console.log(childNode)

        if (whitelistedFunctions) {
          if (
            (name0 && !whitelistedFunctions.includes(name0))
            || (name1 && !whitelistedFunctions.includes(name1))
          ) {
            const extractedCode = extractCodeFromLoc(code, node.loc)
            snippets.push({ scope: functionName, body: extractedCode })
          }
        }
      },

      IndexAccess: function (childNode: any) {
        // console.log(childNode)

        let name: string | undefined = childNode?.base?.name
        if (!name) { name = childNode?.index?.name }
        // const name1: string | undefined = childNode?.expression?.expression?.name

        // console.log(`IndexAccess ${node.name}:`, name)
        if (!name) { console.log(childNode) }

        if (whitelistedMembers) {
          if (
            (name && !whitelistedMembers.includes(name))
          ) {
            const extractedCode = extractCodeFromLoc(code, node.loc)
            snippets.push({ scope: functionName, body: extractedCode })
          }
        }
      },

      MemberAccess: function (childNode: any) {
        // console.log(childNode)

        let name: string | undefined = childNode?.base?.name
        if (!name) { name = childNode?.memberName }
        // const name1: string | undefined = childNode?.expression?.expression?.name

        // console.log(`MemberAccess ${node.name}:`, name)
        if (!name) { console.log(childNode) }

        if (whitelistedMembers) {
          if (
            (name && !whitelistedMembers.includes(name))
          ) {
            const extractedCode = extractCodeFromLoc(code, node.loc)
            snippets.push({ scope: functionName, body: extractedCode })
          }
        }
      },

      // MemberAccess: function (childNode: any) {
      //   // console.log(childNode)
      // },

      // Identifier: function (childNode: any) {
      //   console.log(childNode)
      // },

      FunctionDefinition: function () {
        if (opts && opts.mustBePure === true) {
          if (node.stateMutability !== 'pure') {
            const extractedCode = extractCodeFromLoc(code, node.loc)
            snippets.push({ scope: functionName, body: extractedCode })
          } 
        }
      },

      InlineAssemblyStatement: function () {
        if (opts && opts.allowAssembly === false) {
          const extractedCode = extractCodeFromLoc(code, node.loc)
          snippets.push({ scope: functionName, body: extractedCode })
        }
      },
    })
  } catch(err: any) {
    console.log(err)
    Logger.err({ error: err, report: true })
  } finally {
    return snippets
  }
}