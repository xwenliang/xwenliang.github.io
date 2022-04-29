---
layout: post
title: fis 对 html 文件的压缩
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-06-03 14:57:10+0800
orig_link: https://xwenliang.cn/p/556e9a58e38f7b2966000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


今天在上线一个简单的下载代理页的时候，发现了以前遗留的一个问题。  

以前用 [fis](https://github.com/fex-team/fis) 的时候发现，即使开启了 [html-minifier](https://www.npmjs.com/package/html-minifier), 页面中内嵌的 css 和 js 代码都不会被压缩，只有 html 标签那部分被压缩了。  

这样当页面上内嵌的 css 和 js 代码过多的时候，压缩效果就非常不明显了。典型的例子，就是一些一次性的活动页，这种项目往往不注重后期迭代，开发效率才是首要的。这种场景下，就需要将 css 和 js 全部压缩了。  

去看 html-minifier 的官方文档，会发现它其实是支持压缩页面中的 css 和 js 的，只不过默认是不开启状态：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-30-62e210db3b.jpg)  

再去看 fis 中依赖的 fis-postpackager-html-minifier 模块，确实没有开启 minifyCSS 和 minifyJS 这两项配置：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-30-782bcd1317.jpg)  

那么到这里问题已经解决，直接在 fis 依赖的这个模块中添加开启这两项配置即可。  

其实还是有些不明白，fis 在 release 的时候，只有添加了 -o 参数，才会压缩文件，既然可以选择压缩或者不压缩文件，为何压缩 html 文件的时候，却默认对 html 文件中的 css 和 js 文件不做处理呢？  

适合自己的工具才是最好的工具，所以我们有了 —— [fis-zoo](https://github.com/xwenliang/fis-zoo)  

