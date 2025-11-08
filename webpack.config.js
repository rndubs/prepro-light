const path = require('path');

/**@type {import('webpack').Configuration}*/
const extensionConfig = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  }
};

/**@type {import('webpack').Configuration}*/
const webviewConfig = {
  target: 'web',
  mode: 'none',
  context: __dirname,
  entry: './webview/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist/webview'),
    filename: 'webview.js',
    devtoolModuleFilenameTemplate: '../../[resource-path]'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      'fs': false,
      'path': false
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.webview.json'
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};

/**@type {import('webpack').Configuration}*/
const testConfig = {
  target: 'node',
  mode: 'none',
  entry: {
    // Legacy test runners (for test:legacy scripts)
    'test/runTest': './test/runTest.ts',
    'test/runPerformanceTest': './test/runPerformanceTest.ts',
    // Test suites (used by both legacy and new @vscode/test-cli)
    'test/suite/index': './test/suite/index.ts',
    'test/suite/helpers': './test/suite/helpers.ts',
    'test/suite/extension.test': './test/suite/extension.test.ts',
    'test/suite/fileLoading.test': './test/suite/fileLoading.test.ts',
    'test/suite/webview.test': './test/suite/webview.test.ts',
    'test/suite/rendering.test': './test/suite/rendering.test.ts',
    'test/suite/performance.test': './test/suite/performance.test.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
    mocha: 'commonjs mocha'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.test.json'
            }
          }
        ]
      }
    ]
  }
};

module.exports = [extensionConfig, webviewConfig, testConfig];
