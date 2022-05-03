---
layout: post
title: npm 的又一记坑
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2016-05-20 13:41:30+0800
sync_link: https://xwenliang.cn/p/573ea374866ef7873c000047
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


以前开发 npm 包都是直接 publish 到 npm 官网，然后 install 下来使用，遇到有 bug 的情况就要反复上传新版本，很麻烦，后来有小伙伴说可以使用本地目录或者 github 地址进行测试，今天正好打算尝试下，npm 官方文档：  

[使用本地目录](https://docs.npmjs.com/files/package.json#local-paths)  
[使用github](https://docs.npmjs.com/files/package.json#urls-as-dependencies)  

知道了这些，我们就开始搞吧，先扯个本地目录写两行代码，然后到项目的 package.json 配上本地路径，`npm install` 走你...  
报错了，那再试试放到 github 吧，依然报错，放到 gitlab 呢，还是报错...  

如图：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-27-1c05813bfd.jpg)  

从错误日志来看，其实是因为这个仓库缺少了 package.json 文件，想想也对，人家安装完后要告诉用户安装了哪些包，你没有 package.json 文件，人家怎么会知道你这个包是什么鬼呢。  

综上，要想成功安装，包里必须有符合标准格式的 package.json 文件。还有这个锅好像该自己背...  

