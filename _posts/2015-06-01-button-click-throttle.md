---
layout: post
title: 按钮连点 & 重复提交
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-06-01 15:32:30+0800
orig_link: https://xwenliang.cn/p/53159691822d0f3550695310
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


关于 ajax 重复提交，已经是老生常谈了，相信各位早已有 N 种不同的解决方法了。[传送门](http://www.zhihu.com/question/19805411)  

既然已经解决了重复提交的问题，那按钮连点也不存在什么问题了吧，为什么还要单独拿出来说呢？  

最近在做客户端开发的时候，遇到一些连点的问题。比如，点击某个按钮会调起一个 webview 来装载一个页面，调起 webview 的操作是异步的，但是完全没有 **调起中** 和 **调起后** 的回调或状态，这样就没办法在 **调起中** 这种状态下阻止用户的下一次点击。  

表现出来的现象是，用户点击过快的情况下，会连开几个页面。既然无法在过程中控制，那就只能在源头控制了：控制点击事件的触发频率。  

很自然的我们想到了 stopImmediatePropagation, 它可以 **阻止同一个节点(还有子节点)上其它相同事件监听函数的触发**  

但是也有一些它阻止不了的，比如在本次绑定监听函数之前绑定的监听函数，这么说有点绕，举个例子：  

```javascript
var $a = document.querySelector('a'); 
$a.addEventListener('click', function(){
    console.log(1);
}); 
$a.addEventListener('click', function(e){
    e.stopImmediatePropagation();
});
$a.addEventListener('click', function(){
    console.log(2);
});
```

这种情况下，第一次绑定的 console.log(1) 是阻止不了的。这种情况也好办，在公共文件的头部，加上这个事件阻止就万事大吉了。  

但还有另外一种情况：利用事件冒泡绑定的函数。这种情况就比较蛋疼了。因为你要确切的知道这个冒泡事件绑定的父节点，在这个父节点绑定一个相同类型的事件监听，才能阻止其他相同节点上事件监听函数的触发。  

在项目开始阶段注意这个问题就好办了，统一一下这个父节点的 class, 然后统一绑定一个限制频率的监听函数。  

到了项目优化阶段才意识到这个问题，改动成本就有些大了。最后贴一下限制频率的监听函数(以 class 为 `'js-a'` 的节点为目标节点，class 为 `'js-parent'` 的节点为事件委托的父节点):  

```javascript
function frequent(el, e, interval){
    if(el.clickTime && new Date().getTime() - el.clickTime < interval){
        e.stopImmediatePropagation();
    }
    else{
        el.clickTime = new Date().getTime();
    }
};
$('.js-a').click(function(e){
    frequent(this, e, 1000);
});
$('.js-parent').on('click', '.js-a', function(e){
    frequent(this, e, 1000);
});
```

