import tokenuity from "../../../contracts/tokenuity";

export default {
  zero: '0x0000000000000000000000000000000000000000',
  tokens: {
    base: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
    popular: [
      '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // Binance-Peg Ethereum Token (ETH)
      '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', // Binance-Peg XRP Token (XRP)
      '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', // Binance-Peg Dogecoin Token (DOGE)
      '0x76A797A59Ba2C17726896976B7B3747BfD1d220f', // Wrapped TON Coin (TONCOIN)
      '0xCE7de646e7208a4Ef112cb6ed5038FA6cC6b12e3', // TRON (TRX)
      '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', // Binance-Peg Cardano Token (ADA)
      '0x1CE0c2827e2eF14D5C4f29a091d735A204794041', // Binance-Peg Avalanche Token (AVAX)
      '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D', // Binance-Peg SHIBA INU Token (SHIB)
    ],
    stable: [
      '0x55d398326f99059fF775485246999027B3197955', // Binance-Peg BSC-USD (BSC-USD)
      '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // Binance-Peg USD Coin (USDC)
      '0x8965349fb649A33a30cbFDa057D8eC2C48AbE2A2', // USDC (anyUSDC)
      '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // Binance-Peg BUSD Token (BUSD)
    ],
    removed: [
      '0x40E51e0eC04283e300F12f6bB98DA157Bb22036E', // bloXmove Token (BLXM)
      '0xc748673057861a797275CD8A068AbB95A902e8de', // Baby Doge Coin (BabyDoge)
      '0x6e4024BB8DAe7dC35Cdfa0c86AdfEb7B62D878fa', // FreeCZ (CZ)
      '0xa66cD1C4d890Faa7C1a09A54a254d33d809ba3b5', // Kitty Run (KTR)
      '0x0e1eC38Ee6830934873A2A55527d5aef88888888', // WAR (WAR)
      '0x21FD16cD0eF24A49D28429921e335bb0C1bfAdB3', // 4 (FOUR)
      '0x6e7573e492f31107Ef98029276922854e919cA28', // Matrix SmartChain (MSC)
      '0x5266e89850a0372131837861EFCbF3B574246789', // Oceanic Protocol (OCEA)
      '0x37E2ae82C454A6888E4bbb3e21a6607034832b4f', // Limoverse (Limo)
      '0xF563E86e461dE100CfCfD8b65dAA542d3d4B0550', // COCO COIN (COCO)
      '0x59F4F336Bf3D0C49dBfbA4A74eBD2a6aCE40539A', // Catcoin (CAT)
    ]
  },
  tokenuity: '0x24Bbbd7870B707FACEF478e2e4f69fC39C91F537',
  // tokenuity: '0x412b1549b7a63EBc57747699De0938596b9c03E2',
  // tokenuity: '0x42Bf3C59914B809E7C8E14689370091CD4048fa2',
  // tokenuity: '0x8176b7b8b950eDc683C41595e49278c351135e0B',
  // tokenuity: '0x61297a6Bc266B1a2DE450ae8dFAb5174732A4eC3',
  whales: [],
  pancakeswap: {
    v2: {
      factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
      router: '0x10ED43C718714eb63d5aA57B78B54704E256024E'
    },
    v3: {
      factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      swapRouter: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
      quoterv2: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
      universalRouter: '0x1A0A18AC4BECDDbd6389559687d1A73d8927E416',
      permit2: '0x31c2F6fcFf4F8759b3Bd5Bf0e1084A055615c768'
    }
  },
  uniswap: {
    v4: {
      poolManager: '0x28e2Ea090877bF75740558f6BFB36A5ffeE9e9dF',
      quoter: '0x9F75dD27D6664c475B90e105573E550ff69437B0'
    },
    v3: {
      factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
      quoterv2: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
      swapRouter02: '0x2626664c2603336E57B271c5C0b26F421741e481',
      universalRouter: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
      permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3'
    },
    v2: {
      factory: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
      swapRouter02: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24'
    }
  },
  sushiswap: {
    v2: {
      factory: '0x71524B4f93c58fcbF659783284E38825f0622859',
      swapRouter02: '0x6BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891'
    }
  },
  launchpads: [],
  uncx: {
    uniswapV2Locker: '0xc765bddb93b0d1c1a88282ba0fa6b2d00e3e0c83'
  },
  onlymoons: {
    tokenLockerManagerV1: '0x77110f67C0EF3c98c43570BADe06046eF6549876'
  },
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
  nullAddresses: []
}