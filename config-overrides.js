const webpack = require('webpack');

module.exports = function override (config, env) {
    let loaders = config.resolve;
    loaders.fallback = {
        "fs": false,
        "tls": false,
        "net": false,
        "https": false,
        "zlib": require.resolve("browserify-zlib") ,
        "path": require.resolve("path-browserify"),
        "process": require.resolve("process/browser"),
        "stream": require.resolve("stream-browserify"),
        "util": require.resolve("util/"),
        "crypto": false,
        "constants": false
    };


    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser',
        })
    ]);

    return config;
};
