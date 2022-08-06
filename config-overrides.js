const webpack = require('webpack'); 

module.exports = function override (config, env) {
    console.log('override');
    let loaders = config.resolve;
    loaders.fallback = {
        "fs": false,
        "tls": false,
        "net": false,
        "https": false,
        "zlib": require.resolve("browserify-zlib") ,
        "path": require.resolve("path-browserify"),
        "stream": require.resolve("stream-browserify"),
        "util": require.resolve("util/"),
        "crypto": false,
        "constants": false,
        "process": false
    };

    
   config.plugins = (config.plugins || []).concat([ 
        new webpack.ProvidePlugin({ 
        process: 'process/browser', 
    Buffer: ['buffer', 'Buffer'] 
    }) 
    ]) 
    
    return config;
}
