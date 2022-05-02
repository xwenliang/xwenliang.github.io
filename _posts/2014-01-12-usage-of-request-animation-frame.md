---
layout: post
title: 尝试使用 requestAnimationFrame 来解决之前提到的 GUI 渲染问题
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-01-12 01:38:02+0800
orig_link: https://xwenliang.cn/p/52cbc9ba14e98b7623000012
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


这个问题搁置了很久：[关于 Chrome/Firefox 最小化后停止 GUI 渲染的问题](https://xwenliang.github.io/frontend/2013/11/19/chrome-and-firefox-stopped-render-when-invisible.html)  

据说 requestAnimationFrame 可以解决，只是大致去网上搜了搜关于这个函数的一些信息。并未亲自尝试。MSDN 这样介绍的：[基于脚本的动画的计时控制](http://msdn.microsoft.com/zh-cn/library/ie/hh920765(v=vs.85).aspx)  

看了半天，发现原来 setTimeout 和 setInterval 这一对货色在设置的间隔很小时，可能会丢帧。也就是我们所了解的「最小间隔」。因为浏览器在渲染当前请求的时候，可能又接收了别的渲染请求，导致了「几个请求同时渲染」的情况。  

但是 requestAnimationFrame 的原理是在浏览器渲染完毕当前请求后才会接收下一个请求，相当于它可以直接触发渲染操作，下一次请求只有在当前渲染操作完毕后才会进来（个人理解）。这样就有效的防止了丢帧和过度重绘等问题。  

由于它的这种特性，或许可以对我们上面提到的那个问题有所帮助？因为在浏览器最小化或者切到别的 tab 的时候，浏览器是停止渲染的，也就是说，浏览器同样也不会再接收到渲染请求，只有当下一次进入这个页面，渲染完毕当前请求，下一次请求才会进来。  

正巧它几乎可以支持所有现代浏览器，这样我们在低版本 IE 下仍然使用常规的 setTimeout 和 setInterval (浪费就浪费吧，谁让它那么不争气...)，高级浏览器就使用 requestAnimationFrame, 或许可以完爆这个问题。  

但是似乎有些图样图森破了。这个函数，只是在浏览器接收渲染请求并渲染完毕的时候，会再次发送渲染请求，那么意味着，他只可以用于基础动画，单张滚动图片的场景。  

那么如何来实现间隔几秒钟滚动一张图片呢？难道再在外面用 setInterval/setTimeout 来控制几秒滚动一次？这样似乎同样会引发之前提到的问题。因为这俩货色，即使浏览器不在当前视图的情况下，依然会不停的运行，「囤积」渲染请求。  

后来想到了一个方法，requestAnimationFrame 相当于是一个页面渲染的监听器，当页面发生渲染并渲染完毕后会执行它的回调函数，那么我们只要在回调函数中判断是否完整滚完一张图片就可以了。如果是完整滚完一张图片了，那么设置一个 setTimeout, 比如每滚一张要间隔 2s, 那么就把时间设为 2000ms, 如果还未滚完一张图片，那么就递归这个渲染函数。这样，只有在页面发生了渲染才会有可能有这个 setTimeout. 这样似乎问题就解决了。  

我做了一下尝试：[改进后的轮播图](https://xwenliang.github.io/repro/slide-box-fixed/index.html)(由于用的原生 js, 未做事件支持，懒...)  

这样，即使再切到别的 tab 或者最小化浏览器，页面停止 GUI 渲染，js 也不会再执行代码了，皆大欢喜。  

但是有这样一个问题：当正好滚完一张图片的时候，切到别的 tab 或者最小化浏览器，这时候 setTimeout 延时函数已经开启，所以当过一段时间再切回来的时候，延时的 2s 就被「私吞了」，会直接滚到下一张。不过这也无伤大雅了。  

