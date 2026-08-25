// https://medium.com/@erezro/optimizing-your-node-js-lambdas-with-webpack-and-tree-shaking-899c153403a9

const slsw = require('serverless-webpack')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  mode: "production",
  optimization: { minimize: true },
  externals: [nodeExternals()]
}