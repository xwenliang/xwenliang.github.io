---
layout: post
title: 使用 WebStorm 调试 Nodejs
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-07-29 12:27:45+0800
orig_link: https://xwenliang.cn/p/55b856418bd2df980a000001
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


以前写 Node, 基本上没有什么调试，只是简单的 console. 这样靠「猜」写出来的代码，「基于巧合」的编程，往往是很心虚的。  

用过 node-inspector, 打了断点再点下一步的时候，就会从断点界面跳到 console 界面，不知道为什么会有这么奇怪的行为，不知道最新的版本是不是好些了。所以打算试试传说中的 web 开发神器：webstorm  

下载安装，光是这个安装界面就深深吸引了我：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-30-cf7190390f.jpg)  

安装后就有些摸不着头脑了，从没用 IDE 进行过开发，搜到的一些相关文章也都只是简单讲了如何调试单个文件，没有一些参数或者环境变量的设置。  

而我主要是想用来调试 fis, 首先命令的执行不是在 fis 本身的目录，而是在实际项目目录，其次 fis 的执行不是 `node xxx.js` 的形式，入口文件往往在 /usr/local/bin/ 下，再次 fis 执行的时候往往需要指定一大堆参数...  

后来再研究了下，发现只要配置文件写好了，这一切也是可以做到的，以：  

1. node 安装在 /usr/local/bin/node  
2. fis-zoo 安装在 /usr/local/lib/node_modules/fis-zoo  
3. fis-zoo 运行命令为 `zoo release -wd test`  
4. 实际项目目录在 /Users/zooble/Documents/case/github/xwenliang  

为例，如下配置即可调试该命令：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-30-0aa3be8968.jpg)  

