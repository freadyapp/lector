const path = require('path');
const TerserPlugin = require("terser-webpack-plugin")

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: "@lector",
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()]
  },
  module: {
    rules: [
      // JavaScript/JSX Files
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },{
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      }
    ]
  },
  devtool: 'source-map'
};
