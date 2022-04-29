---
layout: post
title: 博客升级日记
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-08-05 03:00:49+0800
orig_link: https://xwenliang.cn/p/55b1e2402d1e396e4e000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


网站一共进行过三次升级，整理记录一下。  

第一次升级，采用 nodejs + express + mongodb 代替了原来的 wordpress. 从此掌握了大部分服务端的原理，如 session, 如 nginx, 如 http 请求与响应，如数据库的一些基础知识。  

第二次升级，源于上一版博客在依赖配置中偷懒，全部写了使用依赖模块的最新版本，当时没问题，过了几个月后，express 由 3.x 升级到了 4.x, 还有各种依赖的模块都做了不向下兼容的升级，执行了 `npm update` 之后，结果可想而知...  

有了这个教训之后，以后做任何 nodejs 的开发，都会明确的写上依赖模块的版本。但这样仍然让我觉得很不爽，依赖列表一大坨，于是乎启动第二次升级，主要是仿照 express 的接口，自己实现了一个小型的 webserver. 它有一切 express 常用的接口。从此依赖列表就只剩下 4 个了。  

升级过程中，学到了服务器从接到请求到响应请求的详细过程、静态文件的缓存方法、中间件的设计和请求头与响应头的详细信息。但同时也挖了一大堆坑，经常报错导致 node 进程挂掉，无奈启用了 supervisor, 再后来启用了 pm2  

中间还折腾过 session 的存储问题，上一版是用了 express 的 session 管理模块，根本不用自己动手。干掉它之后，只能自己去管理了，一开始是 mongodb 新起了个表，专门用来存储 session, 后来觉得没什么必要，就直接找了个变量，存到内存里了。这样做的结果是 node 进程挂掉，session 就没了...  

各种优化之后，最后只剩下一个 Can`t render headers after they are sent to the client 了。  

第三次升级：  

1. 前端采用 [fis-zoo](https://github.com/xwenliang/fis-zoo) 构建  

2. 服务端完全接口化，整站做成了单页面应用  

3. 解决上面的那条英文 bug  

4. session 重新入库，保证不再丢失  

5. 增加 session 更新机制。变更权限、个人资料可以无需重新登录就生效  

6. 上传图片做类型限制，并计算 md5, 已存在的图片不再重复上传  

这次升级主要是前端的升级和服务端遗留 bug 的解决，采用 backnone 和 pushstate 实现了一个单页面应用，就是目前看到的这版。  

这年头，不弄个什么构建工具，你都不好意思说自己是干前端的...所以用了我们基于 fis 拓展出来的 [fis-zoo](https://github.com/xwenliang/fis-zoo)  

