---
layout: post
title: web 端如何检测设备是否连接外网
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-04-11 16:03:32+0800
sync_link: https://xwenliang.cn/p/5347a0527598534e5080ce47
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


很多童鞋可能会问，有木有开玩笑啊？不连外网的话，怎么访问你的 web 呢？  

所以我要先描述一下应用场景：最近在做的这个项目，就有检测是否连接外网的需求。  

首先描述一下这个项目：它是一个 **无线路由器 + 移动电源 + U 盘** 的东西。由于它内置了无线路由器（移动电源供电），而且附带存储，所以，只要用手机或其他设备连接了它发出的 wifi 信号，就可以访问它内部存储的数据。  

那么通过什么方式来读取它内部存储的数据呢？它内置了一个微型的嵌入式 webserver(GoAhead), 它可以像 nginx 或 apache 一样处理 http 请求。所以只需要在后台读取资源列表，然后做成接口，供前端调用就 ok 了。  

通过上面的描述，我们发现，不连接外部网络，也是可以访问 web 的哈。其实早就有很多类似的应用场景。比如一些公司的内网管理系统，还有路由器等设备。  

但是这个项目中，还有这么一个需求：需要添加一个在线的游戏列表。那么当用户不能连接外网的时候，怎么说也得给出个提示吧，不能直接就显示一片空白吧...那么如何判断用户是否连接外网呢？我想了一个比较蛋疼的方法：  

在页面中加一个 img 标签，然后将其 src 指向百度 logo 的链接。这样当此 img 标签触发了 load 事件的时候，就说明该设备可以访问外部网络了...是不是很机智？  

但是实际应用中发现，这个 img 的 load 事件，触发的总是比较迟钝，即使连接了外网，也得等个几秒钟才会触发。这样会将体验大打折扣，会给出用户错误的提示。  

当时的猜想是：因为浏览器允许同时下载的资源个数有限，可能需要排队，这占据了大部分延迟的时间。  

后来想了个办法，用 js 创建一个 img 标签，并添加百度 logo 的链接。然后 append 到 body. 此时发现，几乎没有延迟了。  

当然这个做法还是比较山寨的，万一哪天百度换掉 logo 的链接地址了咋办 =。=  

所以比较靠谱的办法是，让后台童鞋给做一个专门检测是否能连外网的接口。如果请求了这个接口有返回，就标志用户可以上网了。  

后来发现有个比较符合这个场景的 API: `navigator.onLine`  

