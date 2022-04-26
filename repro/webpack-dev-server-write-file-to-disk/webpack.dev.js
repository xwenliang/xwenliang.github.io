import fs from 'fs';
import url from 'url';
import path from 'path';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

const releaseDir = './target';
const config = {
    entry: {
        main: ['./index.js']
    },
    output: {
        filename: '[name].js',
        chunkFilename: '[name].js',
        path: path.join(__dirname, releaseDir),
        publicPath: releaseDir
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: [{ loader: 'babel-loader' }]
        }]
    }
};
const compiler = webpack(config);
//文件落磁盘
compiler.plugin('emit', (compilation, callback) => {
    const assets = compilation.assets;
    let file, data;
    Object.keys(assets).forEach(key => {
        file = path.resolve(__dirname, releaseDir, key);
        data = assets[key].source();
        fs.writeFileSync(file, data);
    });
    callback();
});
const server = new WebpackDevServer(compiler, {
    contentBase: path.join(__dirname, releaseDir),
    stats: { colors: true },
    setup: app => {
        //监听文件请求，并查找对应文件进行响应
        app.get('*.*', (req, res) => {
            const urlJson = url.parse(req.url, true);
            const pathname = urlJson['pathname'];
            const filePath = path.join(releaseDir, pathname);
            fs.readFile(filePath, (err, fileData) => {
                res.end(fileData);
            });
        });
    }
});

server.listen(3000);