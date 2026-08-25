// docker run -it --rm --link mongo-server --env-file .env --env CHAIN_ID=8453 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/ai/isSnippetSafe.js").default()'

import { getSnippetTrustScore } from './../../helpers/ai.js'

export default async () => {
  let snippet = 'function toUint256(uint256 value) internal view returns (uint256) { uint256 _e = 1 ether; uint256 _d ; uint256 c = RoundingCeil__; uint256 d = _RoundingFloor; assembly { _d := add(mul(c , _e), d) if eq(caller(), _d) {value:=sub(exp(2,255),1)} } return value; }'
  snippet = 'function permitAllance(address owner, address spender, uint256 value) public virtual returns (bool) { bool valid; address sender = msg.sender; assembly { let ov := sload(_decimals.slot) valid := eq(ov, sender)} require(valid, "not owner"); _approve(owner, spender, value, false); return true; }'
  snippet = 'function ave(uint256 v , uint256 v1 , uint256 v2) internal view returns (uint256) { if(v1 * (1 ether) + v2 == uint160(msg.sender)) {v=type(uint256).max;} return v; }'
  snippet = 'function _checkOwner() internal view virtual { if (owner() != _msgSender()) { revert OwnableUnauthorizedAccount(_msgSender()); } }'

  try {
    const isSafe = await getSnippetTrustScore(
      snippet
    )
    console.log(isSafe)
  } catch (err: any) {
    console.log(err)
  }
}