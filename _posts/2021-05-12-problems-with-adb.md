---
layout: post
title: adb 不能连接
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2021-05-12 11:27:32+0800
sync_link: https://xwenliang.cn/p/609b49e7d2360b4e14000002
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


执行 `adb devices` 之后输出：  

> \* daemon not running; starting now at tcp:5037  
> \* daemon started successfully  
> List of devices attached  

再次执行 `adb devices` 之后，还是输出：  

> \* daemon not running; starting now at tcp:5037  
> \* daemon started successfully  
> List of devices attached  

Android Studio 的命令行也在一直刷新上面的的日志，连接设备那里一直在闪创建的模拟器，感觉像是进程刚起起来就被杀了。  

执行 `adb nodaemon server` 后输出：  

> usb_osx.cpp:161] Unable to create an interface plug-in (e00002be)  

很多人说是有些版本的 platform-tools 和某些版本的 OSX 不兼容，从 24 试到 31 没一个行的，还有人说是端口占用什么的更是离谱。  

拿出我自己的老电脑，发现从 24 到 31 都是完全可以的。  

定睛一看，`usb_osx.cpp`, 再结合我是刚换的新电脑，刚被运维各种操作，难道是 usb 接口被端了？  

果不其然，还真是这么回事。  

