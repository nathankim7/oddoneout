var path = require('path');

module.exports = {
    mode: 'production',
    entry: path.resolve(__dirname, 'src', 'App.jsx'),
    output: {
        filename: 'App.js',
        path: path.resolve(__dirname, 'static')
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"],
                        plugins: [
                            "@babel/plugin-proposal-class-properties", 
                            ["@babel/plugin-transform-runtime",
                                { "regenerator": true }]
                        ]
                    }
                }
            }
        ]
    }
}