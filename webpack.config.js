const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

const sassFiles = [
    "login.scss",
    "header.scss",
    "footer.scss",
    "dashboard.scss",
];

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',

    entry: sassFiles.reduce((acc, filename) => {
      const entryName = filename.replace('.scss', '');
      acc[entryName] = path.resolve(__dirname, 'resources', 'scss', filename);
      return acc;
    }, {}),

    output: {
      path: path.resolve(__dirname, 'src/assets'),
      filename: 'js/[name].js',
    },

    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                url: false,
              },
            },
            'sass-loader',
          ],
        },
      ],
    },
    
    optimization: {
      minimize: isProduction,
      minimizer: [new CssMinimizerPlugin()],
    },
    
    plugins: [
      new RemoveEmptyScriptsPlugin(),
      new MiniCssExtractPlugin({
        filename: isProduction ? 'css/[name].min.css' : 'css/[name].css',
      }),
    ],

    devtool: false,
  };
};