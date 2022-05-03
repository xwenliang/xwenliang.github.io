---
layout: post
title: 开发无感知的 webp 升级方案
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2019-03-17 19:51:53+0800
sync_link: https://xwenliang.cn/p/5c8bbb625afc23d55e000003
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


[webp](https://en.wikipedia.org/wiki/WebP) 最早由 Google 收购的 [On2 Technologies](https://en.wikipedia.org/wiki/On2_Technologies) 于2010年9月底提出，2014年初发布的 Chrome@32 和稍早发布的 Android Browser@4.2 完全支持了 webp 的所有特性，包括有损压缩、无损压缩、动态图等，然而直到现在 Apple 生态还是完全不支持 webp, 包括 iOS Safari 和 pc Safari. 虽然如此，我相信终有一天它会被广泛接受，毕竟无损压缩可以减少普通 png 图片体积的45%，jpg 图片的30%，详细对比请看[这里](https://developers.google.com/speed/webp/docs/c_study)  

升级方案主要有两步，第一步是判断客户端支持程度，判断支持程度有两种方法：  

第一种是前端判断环境，根据支持程度选择使用 webp 链接或 png 链接(或是使用 picture 标签，但无法作为背景图使用)  
第二种是服务端判断环境，根据 request header 中的 Accept 中有无 `image/webp` 来判断  

第二步是生成 webp 格式图片，方法也有两种：  

第一种是前端生成，在各种构建工具泛滥的时代，前端构建打包的同时输出一份同名但是以 .webp 后缀结尾的 webp 格式的文件(a.png => a.png.webp)简直是小菜一碟  
第二种是服务端生成(这是废话，也没有第三端了)  

既然要开发无感，又要考虑到服务端成本，所以最终选择了在 Nginx 中检测环境，然后前端构建工具生成同名 webp 格式图片的方案  

Nginx 相关配置：  

```nginx
map $http_accept $webp_suffix {
    default   "";
    "~*webp"  ".webp";
}

server {
    listen 80;
    server_name: 127.0.0.1;
    location ~* ^.+\.(jpe?g|png)$ {
        root /static/root;
        add_header Vary Accept;
        try_files $uri$webp_suffix $uri =404;
        expires 30d;
    }
}
```

webpack相关配置：  

```javascript
const ImageminWebpWebpackPlugin = require('imagemin-webp-webpack-plugin');

return {
    plugins: [
        new ImageminWebpWebpackPlugin({
            config: [{
                test: /\.(jpe?g|png)$/,
                options: {
                    quality: 60,
                }
            }],
            overrideExtension: false,
            detailedLogs: true,
            strict: false
        })
    ]
};
```

这样，当某个图片请求到达服务器时，存在三种情况，比如说是 `a.png`:  

1. 浏览器不支持 webp 格式图片，则 `$webp_suffix` 取默认的无后缀，直接返回 `a.png`  
2. 浏览器支持 webp 格式图片，但服务器上并没有 `a.png.webp`, 则仍然返回 `a.png`  
3. 浏览器支持 webp 格式图片，并且服务器上也有 `a.png.webp`, 则会返回 `a.png.webp`  

这么做还存在几个小问题:  

1. 假如某浏览器请求头中的 Accept 中含有 `image/webp`, 但实际却并不支持webp格式的图片，那明显是要出事的，好在目前还没遇到这种浏览器  
2. 前端构建工具生成同名 webp 格式图片，但一些运营配的在线图片可能并没有同名的 webp 格式图片，所以要定好规范，手动配的图片也需要配一份同名的 webp 格式的图片  

