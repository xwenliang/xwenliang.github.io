---
layout: post
title: url中的#
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 014-04-11 00:45:54+0800
orig_link: https://xwenliang.cn/p/5346cac282c53bab4adf8026
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最初看见这东西，是在网页定位的时候。比如我想让网页一打开就定位在某个位置，我会在 url 后面添加一个 #aaa, 然后网页打开的时候，会自动跳转到 id 为 aaa 的元素的位置，那时候我们叫它「锚点」。

最近做的项目中，差不多是一个类似于百度网盘的项目吧，在打开一些带 # 的文件的时候，会提示无法找到该资源。在服务器端监听请求会发现，后端接收到的数据请求，只是 # 之前的内容。比如，请求这个地址：  

`http://xwenliang.cn/aaa#aa.txt`  

服务器端接收到的请求只是：  

`http://xwenliang.cn/aaa`  

那么这个 # 到底是用来干啥的呢？为什么浏览器的请求会忽略掉它后面的内容呢？  

通过上面的内容，我们了解到，这个 #, 其实只是用于定位网页的显示位置的（指导浏览器行为），与服务器数据无关。所以浏览器在发出数据请求的时候，会忽略掉它和它后面的内容。  

那么如果我就是想要发送一个带 # 的请求，怎么破？  

可以试试 `encodeURIComponent`(`encodeURI` 是不会对 # 进行转译的), 他会将 # 转译为 %23, 后端在接收到 %23 时，会将它还原为 #, 从而绕过浏览器恶心的默认行为。  

类似的还有 ?、& 等，当他们出现在 url 中的时候，都有自己特殊的含义。如果不想被浏览器解析为特殊含义的话，都需要自己手动转译一下。  

在 webapp 兴起的时代，# 还有更有用的地方。由于它可以让浏览器产生历史记录，从而可以利用它来标记浏览器的某一时刻的状态。通过检测 # 后面的内容(onhashchange, 低版本 IE 浏览器需要轮询)，发起相应的 ajax 请求，来还原某一时刻浏览器的状态。实现页面无刷新加载数据保持状态。  

ajax 异步交互数据，虽然会带来相对较好的用户体验，但这会阻碍搜索引擎爬虫对内容的爬取。但是如果希望让 google 爬虫爬取到动态加载的数据，可以使用 #! 这个特殊符号组合。google 爬虫会将其后的内容转成查询字符串 `_escaped_fragment_` 的值。  

比如，如果 google 爬虫爬取到一个地址：  

`http://xwenliang.cn/#!/list`  

它会自动将地址转为：  

`http://xwenliang.cn/?_escaped_fragment_=/list`  

通过这种方式，可以让 google 爬虫爬取到单页面 webapp 的一些数据。  

