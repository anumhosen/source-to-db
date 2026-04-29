// frontend/webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: './src/index.jsx',
        output: {
            path: isProduction
                ? path.resolve(__dirname, '..', 'electron', 'dist')
                : path.resolve(__dirname, 'dist'),
            filename: isProduction ? 'bundle.[contenthash:8].js' : 'bundle.js',
            publicPath: '/',
            clean: true,
        },
        resolve: { extensions: ['.js', '.jsx', '.json'] },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                ['@babel/preset-react', { runtime: 'automatic' }],
                            ],
                        },
                    },
                },
                { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/index.html',
                filename: 'index.html',
                inject: true,
            }),
        ],
        devServer: {
            port: 3000,
            hot: true,
            historyApiFallback: true,
            static: {
                directory: path.join(__dirname, 'public'), // Create this if needed
                watch: true,
            },
            headers: { 'Access-Control-Allow-Origin': '*' },
            open: false,
        },
    };
};
