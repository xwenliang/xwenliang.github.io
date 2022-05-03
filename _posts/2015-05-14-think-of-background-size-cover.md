---
layout: post
title: background-size:cover 引发的思考
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-05-14 18:15:56+0800
sync_link: https://xwenliang.cn/p/552a0f91a09127430f000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


翻了翻以前的代码，发现有很多类似下面这样的地方：  

```javascript
var src='xxx.jpg';
var $img = $('img');
$img.css({
    'background': 'url(' + src + ') center center no-repeat',
    'background-size': 'cover'
});
```

对于有轻度代码洁癖的人来说，这简直不能忍啊，这个 background-size 为什么会出现在这里，为什么不写在 css 里？  

努力回想了下当时的情形，好像是写到 css 里，再去 js 里面给 background 赋值的话，这条属性会失效。为什么会失效呢？貌似不知道，但是一起写到这里就好了，并且还必须写到 background 属性的下面才好。  

这大概就是「基于巧合的编程」吧。下面我们来看看它不生效的真正原因。  

最简单的方法，直接去浏览器里看这条属性是不是被"腰斩"了：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-30-572f69b331.jpg)  

果然，不过想想也是，假如 css 里面有一条 margin-top, 再去行间写个 margin, 不覆盖才怪。  

所以它不生效的真正原因就是被 background 给覆盖掉了。正确的姿势应该是：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-30-12ed1c5e7a.jpg)  

这么简单的问题，当时居然都没有发现，还很自豪的以为自己发现了什么「新大陆」，想想着实可笑啊。  

