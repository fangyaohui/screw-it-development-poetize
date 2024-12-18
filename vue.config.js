const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  devServer: {
    port: 13628,
    https: false,
    open: false
  },
  lintOnSave: false,
  productionSourceMap: false,
  // publicPath: "./",
  configureWebpack: {
    plugins: [
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.js$|\.html$|\.css$/,
        filename: '[path].gz[query]',
        minRatio: 1,
        threshold: 10240,
        deleteOriginalAssets: false
      })
    ]
  }
}
