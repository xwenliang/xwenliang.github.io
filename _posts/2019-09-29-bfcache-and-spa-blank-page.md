---
layout: post
title: BFCache 与 SPA单页面应用前进后退导致白屏
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2019-09-29 18:17:54+0800
sync_link: https://xwenliang.cn/p/5d9084d22754c3df37000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


#### 什么是BFCache  
  
back-forward cache, 为浏览器前进/后退时准备的缓存  

[官方解释](https://developer.mozilla.org/en-US/docs/Archive/Misc_top_level/Working_with_BFCache)提到了 nsIDOMWindow ，那什么是 [nsIDOMWindow](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIDOMWindow) 呢？  

它是 Gecko 内核标准下的一个 interface, 它主要描述了一个承载了 Document Object Model(DOM)的容器，也就是我们常用的 window 根对象。

与之很像的还有一个叫做 [nsIXULWindow](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIXULWindow) 的，它又是干嘛的呢？

XUL的字面意思是 XML-based User Interface Language, [stackoverflow](https://stackoverflow.com/questions/21626687/nsixulwindow-vs-nsidomwindow) 上说它是一个 XUL Application Object Model(AOM) window, 大致看了下 nsIXULWindow 的[具体实现](https://github.com/mozilla/newtab-dev/blob/master/xpfe/appshell/nsXULWindow.cpp), 感觉它应该是浏览器 tab 标签(或新窗口)的实现，那么它和 nsIDOMWindow 的差异就很明显了:  

1. nsIXULWindow 描述的是浏览器标签(窗口)，它还包含浏览器书签、浏览器菜单、配置等内容，nsIDOMWindow 只描述了承载DOM内容的window对象  
2. nsIXULWindow 一个浏览器标签(窗口)只会有一个，nsIDOMWindow 则可以有多个(页面存在iframe的时候)   

而 nsIDOMWindow 又分为了 [outer window 和 inner window](https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Inner_and_outer_windows), 这两者又代表着什么呢？  

outer window 可以理解为浏览器当前上下文，它可以是一个窗口、一个标签甚至是一个 iframe,  

inner window 是用户当前所看到的具体内容，下面这张图很好的说明了他们的关系：

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-19-4a5483655d.jpg)  

蓝色部分是一个个的 inner window, 灰色的框子是 outer window, 在有BFCache的场景里面，你可以认为浏览器只是移动了 outer window 的坐标来直接给你展示已经被 cache 起来的内容  

离开将要被 BFCache 的页面时，页面的 dom 状态以及 js 执行状态都将被冻结，再次打开 BFCache 中的页面，dom不会重新渲染，js不会重新执行，window.onload 也不会被触发，计时器会根据离开时的状态继续运行  

---

#### 如何判断是否命中 BFCache  

那么如何判断是不是进入了一个被 BFCache 的页面，或者当前要离开的页面是不是将要被 BFCache? 答案是 pagehide/pageshow  

这两个事件对象中都有一个 persisted 属性，当这个属性为 true 时，表示页面将要进入 BFCache 或从 BFCache 中取出(分别对应 pagehide 和 pageshow)  

这里有个插曲，在测试 pagehide 的时候，最开始我是用的 alert, 发现一直未执行，后来查证[官方文档](https://developer.mozilla.org/en-US/docs/Web/API/Window/unload_event)才发现，页面的离开一共会触发三个事件：  
1. beforeunload, 这个阶段还是能阻止页面离开的，只要在其事件监听函数中返回一个非空字符串，或者给该事件对象的 returnValue 赋值一个非空字符串(也可以使用 preventDefault(), 各浏览器实现可能有所不同)  
2. pagehide, 进入此阶段就不能阻止页面离开了，包括一些可能阻止页面离开的行为也都将无效，例如 window.open, alert, confirm 等
3. unload, 进入此阶段也同样不能阻止页面离开，同样可能阻止页面离开的行为都将无效，如果页面中包含 iframe, 则该页面的 unload 事件要早于 iframe 的 unload 事件发生  

所以我的 alert 才会不被执行，这里可以使用写入 localStorage 的方式来测试  

---

#### 哪些情况下页面不会被 BFCache 命中  

Firefox:  
1. 页面有监听 `unload` 或 `beforeunload`  
2. 页面的 response header 设置 `cache-control: no-store`  
3. 页面是 https 协议，且 response header 有至少以下一项：  
    1. `cache-control: no-store`  
    2. `Pragma: no-cache`
    3. `Expires: 0` 或者这个值对应的日期比 `Date` 更小
    4. 页面请求没有完全加载完就跳走(包括 XMLHttpRequest )
    5. 页面正处于 IndexedDB 事务中
    6. 页面包含了 iframe, 且该 iframe 由于一些原因不能被 cache (这里列出的原因都有可能)
    7. 页面是由 iframe 加载，该 iframe 跳转到了新的页面，那跳转前的这个页面不会被 cache (只有最后一个页面才会被 cache, 有待验证)  

Safari 情况基本和 Firefox 一致  
Chrome 基本任何状态的页面都不会进入 BFCache, 为什么呢？答案在[这里](https://developers.google.com/web/updates/2019/02/back-forward-cache)，现有的 WebKit 内核对 BFCache 的实现和 Chrome 的多进程架构不兼容  

更多情况有待补充，Android Browser, Android Chrome, iOS Chrome, Android X5...

**有没有特殊情况？**

vue@2.5.x 使用 `MessageChannel` 来修复了一些小问题，但它的存在却[导致 safari 的 BFCache 失效](https://github.com/vuejs/vue/issues/8109)，已经在 vue@2.6.x 版本中修复  
但这种情况并未在[官方文档](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/1.5/Using_Firefox_1.5_caching)中有所说明  
那我们要怎么知道 BFCache 生效或失效的具体原因呢？大家可以根据这个 [tutorial](https://webkit.org/getting-started/) 来配置一个 webkit 项目来调试 `PageCache` 的 `canCacheFrame` 方法  
上面这种情况 `canSuspendActiveDOMObjectsForDocumentSuspension` 这个方法返回失败的原因是存在一个叫做 `MessagePort` 的 `activeDOMObject`  

[vue@2.5.22 BFCache 失效](https://xwenliang.github.io/repro/vue-bfcache-bug/)  
[vue@2.6.10 修复 BFCache](https://xwenliang.github.io/repro/vue-bfcache-bug-repaired/)  

- *特殊情况中的特殊情况： iOS8 在 vue@2.5.x 下 BFCache 仍然是有效的* 

--- 

#### SPA 应用在 iOS Safari 下页面白屏问题  

使用 vue 或 react 开发的单页面应用我们经常遇到以下场景：  

当前页面是一个滚动列表，  
向下滚动几屏后点击一个按钮跳转到第二个页面，  
然后再点击浏览器自带的返回按钮(或右滑返回)返回当前页面  

会发现当前面产生了一块空白且不响应点击的区域，滑动屏幕即恢复正常，审查元素看不到任何内容

*注： 仅 iOS(8-12) Safari 有此问题，京东 iOS APP、京东金融 iOS APP 也同样有此问题，但微信 7.0.4 版本首次回退不会有问题，但多次前进后退会复现*  

其实这跟 vue 或 react 并没有直接的关系，可以试下这个[测试页面](https://xwenliang.github.io/repro/iOS-safari-spa-blank-page/)， 没有使用任何库，在首页下滑几个屏幕后，点击跳一下，然后点击浏览器返回，会发现页面只剩下了 fixed 的按钮部分，灰色的12345内容区域并没有被渲染，滑动屏幕后才会出现  

所有js代码如下：  

```javascript
function renderIndex(){
    // 这里一定要异步渲染，同步渲染则没有此问题
    setTimeout(function(){
        document.getElementById('ul').innerHTML = '<ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ul>';
    }, 1000);
};
function renderDetail(){
    document.getElementById('ul').innerHTML = '<h1 class="detail">Detail</h1>'
};

function render(){
    var hash = location.hash;
    if(hash === '#detail'){
        renderDetail();
    }
    else{
        renderIndex();
    }
};

render();
// 监听 hashchange 也会出现同样的问题
window.addEventListener('popstate', function(e){
    render();
});

window.addEventListener('pageshow', function(e){
    document.getElementById('status').innerHTML = '是否从BFCache中读取: ' + e.persisted;
});
```

---

#### 为何会出现这个问题呢，跟 BFCache 有什么关系吗？  

目前还未找到相关的证据，但是按照目前官方文档对 BFCache 的解释：用户点击了链接导致浏览器替换了当前窗口里的内容(new page), 跳转到了新地址，才会发生这一行为，通过上面的代码也可以看到，BFCache 确实没有触发    

我们知道，浏览器有记录滚动条位置的行为，具体表现为：打开一个高度大于一个屏幕的页面，向下滚动后刷新浏览器，再次打开的页面仍然是之前滚动条所处的位置  

但这是有前提条件的，那就是这个高度必须是 **同步渲染的内容所撑开的高度**，如果是在js中异步渲染导致撑高的页面，那刷新页面将会丢失滚动条位置并回到顶部   

[同步渲染保持滚动位置](https://xwenliang.github.io/repro/scroll-position-reset/sync-render.html?a=1)  
[异步渲染丢失滚动位置](https://xwenliang.github.io/repro/scroll-position-reset/async-render.html?a=1)  

异步渲染丢失滚动条位置，不同的浏览器给出的答案也不一样，Chrome、Firefox 需要一定的渲染延时才会丢失，而 Safari、iOS Safari 只要将渲染放到异步操作中就会丢失  

如果跟浏览器重置滚动条的行为有关，那我们在页面初始渲染时就给它一个固定的渲染高度，是不是可以解决这个问题呢？

[异步渲染但是给 body 设置一个异步渲染后才会撑开的高度](https://xwenliang.github.io/repro/scroll-position-reset/async-render-fixed-height.html?a=1)  

我们发现浏览器确实都能记录滚动条位置了，那么这种方法能解决上面提到的 SPA 白屏的问题吗？  

[SPA单页面应用设置滚动页面固定高度](https://xwenliang.github.io/repro/iOS-safari-spa-blank-page/fixed-height.html?a=1)  

确实解决了这个问题，但在实际应用中可能有些麻烦，我们需要先计算页面的渲染高度，有没有其他方法呢？

既然出现这个问题后，滑动下页面就恢复正常了，我们或许可以尝试模拟页面滚动行为：跳到下个页面前先记录当前滚动条位置，跳回来后 `window.scrollTo` 这个位置  

经过测试这种方法确实也是可行的，但是需要注意，`window.scrollTo` 这个操作必须要在页面渲染完成以后  

