---
layout: post
title: webpack-dev-server 编译文件写入磁盘
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2018-04-12 18:41:40+0800
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


了解 `webpack-dev-server` 的同学们都知道，启用它之后编译生成的文件是存在内存里不落磁盘的，但如果我就是想落磁盘应该怎么操作呢？  

先来看看 `webpack` 官方是怎么回复这个问题的：[#issue62](https://github.com/webpack/webpack-dev-server/issues/62), 先是让用 `webpack --watch` 来解决，然后质疑了为什么会有这种需求，再然后另外一位 Contributor 回答说假如你监听的端口是 9000, 那么可以访问 `http://localhost:9000/webpack-dev-server` 来查看生成的文件。  

这些回答都没有实际解决我们的问题：我们要在磁盘上查看，要用自己的编辑器打开甚至 debugger, 而不是在浏览器的资源管理器里。然后又有同学提出了使用类似 `write-file-webpack-plugin` 的插件来实现写入磁盘，[stackoverflow](https://stackoverflow.com/questions/41928358/webpack-how-to-compile-write-on-disk-and-serve-static-content-js-css-using-w) 上的高票回答是这样：  

> `webpack --watch & webpack-dev-server --inline --progress --colors`  

虽然这些方法实现了文件写入磁盘，但我们访问的 devServer 仍然是使用了内存中的文件，也就是说，我们去磁盘上修改编译后这些文件是不会生效的。那有什么方法能够实现，既让文件落磁盘，又能让 devServer 使用落在磁盘上的文件呢？  

既然官方没打算做这方面的支持，我们只能自己想办法了，想到 `webpack-dev-server` 的 [setup](https://webpack.js.org/configuration/dev-server/#devserver-setup), 原本它是用于 mock 数据的神器，既然能模拟数据，那肯定也能接收到文件请求吧，我们的思路就是监听文件请求然后读取编译目录中对应的文件来响应。由于我习惯于使用 `webpack` 的 [Node API](https://webpack.js.org/api/node/), 所以编译文件落磁盘就一起写了，这个过程也并不复杂，只需要在 webpack 的[ emit 阶段](https://github.com/webpack/docs/wiki/how-to-write-a-plugin#async-compilation-plugins)拿到编译结果，从编译结果中拿到编译文件然后写入磁盘就可以了。示例代码：  

```javascript
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
```

完整的例子在[这里](https://github.com/xwenliang/xwenliang.github.io/tree/master/repro/webpack-dev-server-write-file-to-disk)  

需要注意的是，[setup](https://webpack.js.org/configuration/dev-server/#devserver-setup) 在 `webpack-dev-server@3.0.0` 及以后将要被移除，取而代之的是 [before](https://webpack.js.org/configuration/dev-server/#devserver-before) 和 [after](https://webpack.js.org/configuration/dev-server/#devserver-after), 用法是一致的。  

相关库的版本：  
webpack: `2.7.0`  
webpack-dev-server: `2.11.2`  

