// docker run -it --rm --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/tokens/parseTokenSourceCode.js").default()'
// docker run -it --rm --env-file .env --env CHAIN_ID=56 -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/tokens/parseTokenSourceCode.js").default()'

import { getTokenSourceCode, } from './../../helpers/tokens.js'
import { getSourceCodeData } from './../../helpers/snippets.js'

// let a = '0xf3bdABFfe688578C3740fB30684cAe20f296f263' // clean
// a = '0x4dB82752b98f8abC1339A1f8554efF44ED93778b' // clean
// a = '0x7A226B9A2d01bdB2FEe8D69c3181E1f6E25C6a66'
// a ='0xd8000337Ec869e148d4383a1b04Dde4c1E5277d4'
// a = '0xf4721536Ae7966CDd34e2b6F19086DFC8950A847'
// a = '0x2b1b9e2E4F9e0a3256622EabCE9D5ac32514A518'
// a = '0xb3624a6655be57588eF8d21950DF3e1a6f1bce75'
// a = '0x50Ab07bf2B2E2bb41F9f3465177460907311FFB0'
// a = '0x556FE2d5149d46402B0d332433a9F608917b8Da0'
// a = '0x483413B345ee0F1a25714fc0f77925769433c111'
// a = '0x4b5d756D2ed93D035b0e18a6D5629A29c46E4734'
// a = '0x2b6F53A370280d5102e291a2502C21A9b762Fa8e'
// a = '0x2ead0c4cC33F07C254F02aF59530abebaA1cE8D5'
// a = '0x872cC3Fcbb666912003b65e4C257a5143ff8e7aE'
// a = '0x25e2c3B7B91A429c733adb54c563A77d29B8c5c8'
// a = '0x56e6aBC9d2DE06d11f94994aA913545FD9C6b315'
// a = '0x8086f739d224fD2Df762bC210eeB4268c6fC3650'
// a = '0x268cD2a3f430b0EaBEE241AcDa45b0b82FA27920' // trySub
// a = '0x4fB108dca94b26dd16B55901D494D8C96A8e78eB'
// a = '0xfEe7d2f1622d947F9bfB1358e0c9FA3528910d8a'
// a = '0xF0D7C5c0b799cfF9b85e429fD41F0CeD9d12641a'
// a = '0xe82009A75678AF6F29534a9eeCE538B5dd35C3B7'
// a = '0x5B0C0d549Ac864d4d4EEd49FA4Af28A662d440Db'
// a = '0xC79B86c1DED9c9F69ba3290FA976800E2C7f7a93'
// a = '0x66c3e6C535259B07B13fC5328b78600239Dd943E'
// a = '0xb04A4B2f815CC06Dc38F30143F9720936b95DC9F' // increaseAllowance
// a = '0x06889fAA425Bf0d6A8F47dA0419409CBDa946Ef6' // transferFrom, _transfer
// a = '0xb0C97628f2453A4CB27CabE328027f164F803dC7' // recover
// a = '0xc8b4D23Ca2A71bd06d46BbAc03be57abe69b89C7' // increaseAllowance
// a = '0x47429D59c44027a2813fADd4166e3817f8cfeEDD' // _transfer
// a = '0x2B5dEd41Fc79A49e20Af7e24d5946C5f19bA25DD' // _transfer
// a = '0x399C3eD08966Fd7EC34388d981523607b73CD6C5' // _beforeTokenTransfer
// a = '0x3035b1b6Be3E9b1dEF594Ec2F300f98BF76f5524'
// a = '0xffDd07F07eb532C6c3D6667C4d5e97A0249eF1a0'
// a = '0xC7181d0aE790D824B52C20bE218182CD5a3C0bFf' // toUint256
// a = '0x09a9Eb0A8F7911924c806887D028fC2c3e17A886' // permitAllance
// a = '0x8E59F76AA7aDAA9859D6CEb3e9F44C9f8C296e60'
// a = '0x68Aacef68513eF44cD22E68A6c622BF9832bE828'
// a = '0xAb4454b76aA28C43de878f38464A137122448345' // good
// a = '0xaad0757D560a322373C8DA887007df9c7591fd25' // good
// a = '0xf0A3C129C29c4b1CF6949Eb23B1d2805349e393C' // good
// a = '0x43d6e637de64F23271a271B9761479b12CcB8673'
// a = '0xb9d288165F5342F2C9F030484e7D22b7ab178666'
// a = '0xA3D12b337759665832232bE9b074AB5c9A0e5289'
// a = '0x6d76E113f99dFaF35FF20E2B570188Cd5dAa5b8E'
// a = '0xe6603E9d1d2BD411e2D2815e44a197b6fF8402B7'
// a = '0x11a53Fda83739285029099e33FacB282B3C1dBB2'
// a = '0x1Cf1B27E7019b6B8041530FD89225527a37B98e9'
// a = '0xb3bF0955eF576DeE16f123690BEE1A085D02f1c9'
// a = '0x7c9E01515452b880Ab469782aa9d3CB3eE0a221C'
// a = '0x92474C732B334b0aF296069F6BA314Abc418b5e5'
// a = '0xfAA0D790af668eb86748Bc538AFb3e1D9063F73F'
// a = '0xc0750af66D3fa88a7d66B04D3380C4f1365b7FE8'
// a = '0xf79D15d4eb9156D6604c1E9025dF0F0d58893791'
// a = '0x03Bc7BDe211eCAE982f51B6cAF77061Ce0EfaFfF'
// a = '0x235E59a7664532df176b44055769653ef0362DBd'
// a = '0x2E98835DfF40682c193A70894115D3e437521288'

let a = '0xfa8E4052b8Fe8ed24D8e9de088CBfd50E6984444' // 56

export default async () => {
  try  {
    let code = await getTokenSourceCode(a)
    const sourceCodeData = getSourceCodeData(code)

    console.log(sourceCodeData?.snippets)
  } catch (err: any)  {
    if ('message' in err) {
      console.log(err.message)
    }
  }
}