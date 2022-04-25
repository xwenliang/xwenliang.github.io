var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');

var config = {
    entry: {
        main: ['./index.js']
    },
    output: {
        filename: '[name].js',
        chunkFilename: '[name].js',
        path: path.join(__dirname, './target'),
        publicPath: './'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader'
                    }
                ]
            }
        ]
    }
};


var compiler = webpack(config);
compiler.apply(new webpack.ProgressPlugin());
// write file to disk
compiler.plugin('emit', (compilation, callback) => {
    var assets = compilation.assets;
    var file, data;
    Object.keys(assets).forEach(key => {
        file = path.resolve(__dirname, './target', key);
        data = assets[key].source();
        fs.writeFileSync(file, data);
    });
    callback();
});

var server = new WebpackDevServer(compiler, {
    contentBase: path.join(__dirname, 'target')
});

server.listen(3000/*, '127.0.0.1'*/);

