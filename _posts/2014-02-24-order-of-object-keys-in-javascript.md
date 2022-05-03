---
layout: post
title: Javascript 中对象的有序无序问题
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-02-24 11:35:25+0800
sync_link: https://xwenliang.cn/p/52cbc7e114e98b7623000010
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


前些天看到一个奇怪的现象：有的同学，想得到一个有序的数据集合，但是后台 GG 却给了他一个 json 的结构，并且他们还成功的完成了这个功能...  

当时我就犯嘀咕，差点三观尽毁。难道 js 中的对象是有序的？我怎么一直记得是无序的啊。然后赶紧做个呆猫试了试...  

吓！？果然是有序的吗...有点不甘心，一口气写了几十个，a-z 写完了，发现依然是按先后次序输出的...不仅如此，后插入的，也会最后输出：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-05-02-90505b94fe.jpg)  

有点崩溃了，转而求助于 python:  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-05-02-c34531b7b6.jpg)  

发现，我大 python 还是很有节操的没有按序输出...  

但是上面的结果能够说明 js 中对象是有序的吗？我们只用了字母作为 key, 是不是有点特殊呢？何不再来几发更特殊的呢，比如数字啥的：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-05-02-26ae9ab381.jpg)  

这结果，真是劲爆啊，输出顺序竟然是 **数字 > * > 字母**，并且数字还会按照大小顺序升序排序，但是字母却不排序...  

我大 js 果然是如同脱缰的野马，让人捉摸不透啊...至于输出顺序为什么会是这样先不说，最起码可以证明 **javascript 的对象是无序的** 了吧。  

用的时候要小心呦，有序的话，还是用数组吧，虽然只能用默认下标，起码可靠嘛...  

