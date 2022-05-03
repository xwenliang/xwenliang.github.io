---
layout: post
title: JS 中的延迟执行与 GUI 渲染
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2013-11-21 15:41:33+0800
sync_link: https://xwenliang.cn/p/528d9d24c5b0480536000006
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最近在做这个编辑器的时候，反复用到延迟执行，在这里总结一下。  

先来看一段代码：  

```javascript
alert(1)
setTimeout(function(){
    alert(2);
}, 0);
alert(3); 
```

看上去应该是依次弹出 1, 2, 3. 点击运行后发现，弹出顺序却是 1, 3, 2. 为什么会这样呢？不是设置了 0 秒的延时吗？为啥还是跑到最后执行了。难道是因为这一步比较耗时，所以就先弹出了 3 ?  

我们来试另一段代码：  

```javascript
setTimeout(function(){
    alert(2);
}, 0);
new Array(1e8).join();
alert(3);
```

运行后，我们发现，尽管在弹出 3 之前加了一步更耗时的操作，2 依然要等到 3 执行了才会执行。这说明，setTimeout 中的函数，是放到异步事件队列里面了，当前同步的代码执行完毕，才能开始事件轮询，然后才会开始执行。  

我们再来一段代码：  

```javascript
$('body').css('background', 'blue');
setTimeout(function(){
    $('body').css('background', '#f9f9f9');
}, 5000);
new Array(1e8).join();
```

第 5 行加了一步同步的耗时操作，我们发现第 1 行的代码，要等到第 5 行代码执行完毕才会开始执行，其实这个指令浏览器是瞬时接收到的，但是 GUI 渲染要等到同步操作执行完毕后才会开始执行。  

执行插入节点操作后，绑定事件的函数已经执行，然而 GUI 却还没有开始渲染。所以就会发生当我们动态创建节点并添加到 dom 的时候，新创建的元素上绑定的事件不执行的情况。高级浏览器可能有所改善，但 IE8 以下一定会出现这样的问题。  

这说明，浏览器的执行顺序应该是：同步代码 > GUI 渲染。  

那么 GUI 渲染和异步事件队列，哪个优先级高呢？再看下面一段：  

```javascript
$('body').css('background', 'blue');
setTimeout(function(){
    new Array(1e8).join();
    $('body').css('background', '#f9f9f9');
}, 0);
new Array(1e8).join();
alert('done!'); 
```

我们发现，alert 这货居然和 body 变色同时发生...也就是说，alert 其实也会触发 GUI 渲染。  

既然它可以触发 GUI 渲染，那么它就一定可以阻塞 JS 的运行，我们一直不点确定，过很久之后再点，发现果然 setTimeout 里面的耗时操作还会发生，这说明浏览器的执行顺序： GUI 渲染 > 异步事件队列。  

等等，接着看下面：  

```javascript
$('.content').css('background', 'blue');
setTimeout(function(){
    new Array(1e8).join();
    $('.content').css('background', '#f9f9f9');
}, 0);
new Array(1e8).join();
console.log('done'); 
```

纳尼？这段代码和上面的差别只是把 alert 换成了 console, 可是 body 却不变色了？这又是什么原因呢？  

猜想可能是上面的那句 alert, 强制触发了页面渲染，所以浏览器运行完同步代码的时候，立马就进行了页面渲染。想想这也是合情合理的，因为 alert 也是浏览器窗口的视图，想要在同步代码执行完毕就立马显示，就必须强制触发页面渲染。。  

如果没有 alert 强制渲染，则要等到马上就要发生的异步事件队列里面的函数执行完毕后才发生渲染。  

我实验了下，chrome 下这个临界值在 1500ms 左右。  

综上：  

在同步代码有 alert 的情况下，浏览器的执行顺序为：同步代码 > GUI 渲染 > 异步事件队列。  
在同步代码没有 alert 的情况下，浏览器的执行顺序为：同步代码 > (1500ms 内的)异步事件队列 > GUI 渲染 > (1500ms 外的)异步事件队列。  

纠错：  

上面得出的临界值，应该跟显卡的运算能力有关，显卡越强劲，每秒渲染的帧数越多，那么这个临界值就越小。可以理解为：浏览器在接收到渲染请求后，会告诉显卡处理这个渲染，但是过了一小会浏览器再次告诉显卡要进行另外一个渲染，但是当前这个还没渲染完呢，那就直接把页面渲染成把两个结果结合起来的效果吧！  

测试浏览器： `chrome29`  

