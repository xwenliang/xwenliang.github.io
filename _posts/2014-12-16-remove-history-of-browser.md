---
layout: post
title: 如何干掉浏览器历史记录
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-12-16 11:42:11+0800
orig_link: https://xwenliang.cn/p/548faa0ad6a065da2a000003
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


今天有个同事问我，从 a->b->c->d 依次跳转页面，如何做到，在 d 页面点浏览器的后退，直接退到 a 呢？  

其实我也不会...但是咱们不是有 google baidu 嘛，虽然大多时候都是坑爹答案，但是也木有更好的办法啊（我会说其实我是想做一个靠谱的前端问答网站吗..）  

经过一番折腾，发现了 `window.location.replace` 这个方法，[传送门](https://developer.mozilla.org/en-US/docs/Web/API/Location.replace)  

> The `replace()` method of the `Location` interface replaces the current resource with the one at the provided URL. The difference from the `assign()` method is that after using `replace()` the current page will not be saved in session `History`, meaning the user won't be able to use the back button to navigate to it.  

知道了它，咱们就好办了，从 a->b 的时候，正常跳，然后 b->c->d 分别都用 `window.location.replace` 来跳转，最终在 d 页面点浏览器回退的时候，自然就直接到了 a.  

