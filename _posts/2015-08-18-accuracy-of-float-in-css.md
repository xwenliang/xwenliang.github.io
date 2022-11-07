---
layout: post
title: css 中小数点的精度问题
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-08-18 19:47:21+0800
sync_link: https://xwenliang.cn/p/55d2fa9dfdc585c43d000011
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


今天同事遇到一个奇葩的问题，我以前好像也遇到过，但没有深究，这告诉我们，遇到问题一定要刨根问底，否则将来某一天你一定还会与它不期而遇😂  

我们经常会遇到一些横向排列的布局，并且横向排列的总宽度要大于显示宽度，如轮播图，左右滑动菜单等。通常的做法就那么几种：  

1. white-space:nowrap + display:inline-block  
2. display:box/flex + box-flex/flex:1(or other)  
3. float + 父元素宽度动态计算  

步入移动互联网时代后，大多使用第二种了，而我却比较喜欢第一种，虽然需要加点小 hack 去除间隙。我同事正好使用了第三种，于是遇到了这个奇葩的 bug  

问题是这样的，一个左右滑动菜单，共有四个栏目(有几个栏目是从后台获取的)，分别获取了这几个栏目的宽度，然后设置其父容器的宽度为这几个栏目宽度的总和。逻辑上没有任何问题，然而栏目却只出现了三个，设想可能是宽度不够，将父容器宽度+1, 第四个栏目果然出来了。  

明明计算好的，为什么会这样呢？用 getComputedStyle 分别获取了四个栏目的宽度，发现居然有个 66.3px, 然而用 Zepto 获取其宽度，赫然是 66px... 那么问题就找到了，父容器的宽度小了 0.3px, 当然装不下这四个栏目  

为什么会小 0.3px 呢？难道 Zepto 做了什么处理吗？翻阅其源码后发现：  

![IMAGE]({{ site.gallery_prefix }}2022-04-29-47608b447b.jpg)  

尼玛啊，Zepto 你要不要如此坑爹。。。  

故事到这里就结束了吗？然而才刚刚开始。。。  

尝试将上面提到的父元素的宽度设置为修正后的宽度，发现然而并没有卵用。。。  

看下图：  

![IMAGE]({{ site.gallery_prefix }}2022-04-29-4d3b9d36fe.jpg)  

简直毁三观啊。。。估计这时候浏览器会说：臣妾做不到啊。。。  
这也难怪 Zepto 会把小数点给四舍五入掉，它的存在根本没有太大的意义啊  

再看一张毁三观的图：  
![IMAGE]({{ site.gallery_prefix }}2022-04-29-0b89535bbe.jpg)  

分三种方法查看该元素的宽度，居然得到三种不同的答案，浏览器你的节操呢😂  

但是从这里可以看出来，以后再获取宽度的时候，使用 offsetWidth 将是比较保险的选择，当存在小数点的时候，它一般要比实际显示的宽度要略大一些。  

另外经过测试还发现，当小数点的值是 .25/.5/.75 的时候，通过 getComputedStyle 取得的值是精确的，并且审查元素的时候，看到的宽度也是相同的。(但也存在特殊情况，如 inline-block 元素里面的文本内容超过该元素的宽度的时候，将会发生更不可思议的情况，通过 style 设置的宽度，用 getComputedStyle 获取的宽度是这个值，但直接审查元素或通过 offsetWidth 获取的宽度却不是该值)  

通过本文我们可以看到，将 Zepto 的宽/高度向上取整，应该可以解决上文提到的同事遇到的 bug  

Tips: $0 指代当前正在审查的元素。  

