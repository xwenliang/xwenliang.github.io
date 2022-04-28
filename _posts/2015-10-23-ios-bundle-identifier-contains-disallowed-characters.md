---
layout: post
title: The bundle identifier contains disallowed characters
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-10-23 18:51:14+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


今天往 Apple 服务器发包又碰到了钉子：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-29-f70fb047c8.jpg)  

思前想后，自己只是改了两行逻辑代码，根本没有修改任何的配置，怎么会出现这个错误呢？再说苹果你也是够了，告诉我包里有非法字符，却不告诉我在哪里，这是让我去猜吗？没办法，只能猜了。  

搜索引擎转一圈，发现很多人都是今天才提的这个问题，说明苹果后台又更新策略了。大致解决方法是：删掉一些第三方资源包中的 .plist 文件  

为什么删除就好了呢，我们打开其中一个来看看：  

![IMAGE]](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-29-dacb370ba4.jpg)  

果然是乱码一堆啊，难怪告诉我有非法字符呢。不过也可能是我的编辑器编码不支持，用 xcode 打开就是正常的。但同样是 .plist 文件，用我的编辑器打开项目的 .plist 文件就是正常的类似于 xml 的一个文件。既然第三方资源包里的 .plist 文件说删就删掉，并且没有影响，那为啥作者还要在包里加这个只会起负面作用的文件呢？  

先看看[ .plist 文件](https://zh.wikipedia.org/zh-cn/Plist)到底是啥，原来就是个存储数据的文件，大家通常会用来存储一些配置。既然是个存储配置的文件，删掉这个文件后，当这个第三方资源包里的代码要去读取配置的时候，找不到这个文件不会出什么乱子吗？  

由于目前对 iOS 掌握的知识比较少，大概等以后自己开发资源包给别人用的时候，就会知道这个 plist 文件到底是个怎么样的角色了吧。  

