---
layout: post
title: 页面禁止滚动
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2018-12-03 23:12:23+0800
sync_link: https://xwenliang.cn/p/5c0547d7ec6199f64f000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最近做了个图表的东西，图表上有拖拽的交互，在拖拽的时候不小心就会拖动到页面，为了避免这个交互带来的影响，很自然的我们想到了阻止页面滚动常用的伎俩：  
  
```javascript
document.body.addEventListener('touchmove', e => {
    e.preventDefault();
}, false);
```

打开页面发现，好像并没有生效，并且报了这么个错误：  

> [Intervention] Unable to preventDefault inside passive event listener due to target being treated as passive. See https://www.chromestatus.com/features/5093566007214080  

点开这个链接发现，从 chrome56 开始，Document Level(window, document, body) 默认都是 `{passive: true}` 的，那么这个东西是用来干嘛的呢，看了这个 feature 后面的[链接](https://developers.google.com/web/updates/2017/01/scrolling-intervention)发现，它是用来优化滚动体验的：  

从 chrome56 开始：  
`window|document|document.body.addEventListener("touchstart", func);`  
默认等于：  
`window|document|document.body.addEventListener("touchstart", func, {passive: true});`  

以前我们所知道的 `addEventlistener` 第三个参数是声明函数监听在 capture(true) 阶段还是 bubble(false) 阶段，从来不知道原来它可以是个[对象](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Parameters)：  

```javascript
addEventListener(type, func, {
    capture: false,
    passive: false,
    once: false
})
```

那么它是如何做到优化体验的呢？仔细看了上面提到的[链接](https://developers.google.com/web/updates/2017/01/scrolling-intervention)：  

> If you call preventDefault() in the touchstart or first touchmove events then you will prevent scrolling. The problem is that most often listeners will not call preventDefault(), but the browser needs to wait for the event to finish to be sure of that.  

如果 `touchstart` 或者 `touchmove` 的时候我们的监听函数中有 `preventDefault`, 那页面就必须不能滚动，所以页面的每一次滚动都需要等待监听函数全部执行完毕后才能滚动，但是大部分时间我们都没有在监听函数中去 `preventDefault`, 导致页面滚动之前白白等待了监听函数执行的时间，导致滚动卡顿。所以 `passive` 应运而生了，设置 `{passive: true}` 表示声明监听函数中不会有 `preventDefault` 的行为，从而页面滚动也无需等待所有的监听函数执行完毕。  

那么如果设置了 `{passive: true}`, 又在监听函数里面设置了 `preventDefault`, 就会出现本文一开始提到的报错。  

那么如何解决这个问题呢，只能是手动设置 `{passive: false}` 或者将内容包裹至一个 div 中，在 div 上绑定 touch 事件来设置 `preventDefault`, 因为目前只有 window/document/body 上绑定的 touch 事件默认是 `{passive: true}` 的。  

**也可以说明目前window/document/body上自带的滚动条是最为流畅的，完爆其他一切JS模拟滚动。**  

chrome 版本: `70.0.3538.110`  

