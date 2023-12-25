const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const glob = require("glob");
const path = require("path");

module.exports = {
  entry: {
    "bundle.js": glob
      .sync("build/static/?(js|css)/main.*.?(js|css)")
      .map((f) => path.resolve(__dirname, f)),
  },
  output: {
    filename: "build/static/js/bundle.min.js",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        exclude: /node_modules/,
        test: /\.js$/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
        },
      },
    ],
  },
  plugins: [new UglifyJsPlugin()],
};
