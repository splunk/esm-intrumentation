const path = require("path");
const slsw = require("serverless-webpack");

module.exports = {
  entry: {
    "test-service": ["./test-service.js"],
  },
  target: "node",
  mode: slsw.lib.webpack.isLocal ? "development" : "production",
  module: {
    rules: [
      {
        test: /\.js$/,
        include: __dirname,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
          },
        ],
      },
    ],
  },
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js",
  },
};
