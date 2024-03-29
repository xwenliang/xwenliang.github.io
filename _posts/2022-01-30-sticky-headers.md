---
layout: post
title: 监听 CSS position:sticky 的事件
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2022-01-30 16:08:48+0800
sync_link: https://xwenliang.cn/p/61f64760e716903a1f000001
# 原文发表时间 和 原文链接
orig_date: 2017-09-19
orig_link: https://developer.chrome.com/blog/sticky-headers/
categories: translation
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


在新的 app 开发中或许我们可以不再需要 `scroll` 事件了。接下来我将演示当 `position:sticky` 的元素改变状态时如何使用 `IntersectionObserver` 来触发事件，但是不使用滚动监听事件。下面是例子:  

![IMAGE]({{ site.gallery_prefix }}2022-04-05-020201e00e.gif)  

[例子](https://xwenliang.github.io/repro/sticky-position-event/sticky-position-event.html) \| [源码](https://github.com/xwenliang/xwenliang.github.io/tree/master/repro/sticky-position-event/sticky-position-event.html)  


### `sticky-change` 事件的介绍  

> 这是一个 CSS position:sticky 缺失的事件，目前并不存在  

目前浏览器并没有提供当 CSS 的 `position:sticky` 激活时的事件。换句话说，当一个元素变成 sticky 或者解除 sticky 时我们接不到任何事件通知。

看下面的例子，这是一个把元素固定在距离滚动容器顶部高度 10px 的样式：  

```css
.sticky{
    position: sticky;
    top: 10px;
}
```

当元素触发上面的样式行为时，浏览器触发事件通知我们，岂不是一件美事。并且[不止是我这么想](https://stackoverflow.com/questions/16302483/event-to-detect-when-positionsticky-is-triggered)。这个事件通知可以用于以下几种场景：  
1. 给触发 sticky 的元素设置一个阴影  
2. 用户阅读文章内容时，准确的记录他们的阅读进度
3. 用户滚动页面时，对应段落的标题始终悬浮在当前段落的上方

为了应对上面的这些场景，我们就有了行动目标：创造当 `position:sticky` 的元素变为 `sticky` 时就触发的事件。我们暂且命名为 `sticky-change`:  

```js
document.addEventListener('sticky-change', e => {
  const header = e.detail.target;  // header became sticky or stopped sticking.
  const sticking = e.detail.stuck; // true when header is sticky.
  header.classList.toggle('shadow', sticking); // add drop shadow when sticking.

  document.querySelector('.who-is-sticking').textContent = header.textContent;
});
```

这个[例子](https://xwenliang.github.io/repro/sticky-position-event/sticky-position-event.html)就是使用这个事件的效果，当 header 变为 sticky 时添加阴影并且设置新的内容：  

![IMAGE]({{ site.gallery_prefix }}2022-04-05-020201e00e.gif)  


### 不使用滚动事件的滚动效果  

![IMAGE]({{ site.gallery_prefix }}2022-04-05-632630d740.jpg)  

我们先来下几个定义：  
1. Scrolling container - 整个页面的内容区
2. Headers - 每个段落的蓝色标题，有 `position:sticky` 样式  
3. Sticky section - 每个段落蓝色标题下的的内容区  
4. Sticky mode - 蓝色标题变为 sticky  

想要知道让哪标题进入 `Sticky mode`, 我们需要获取 `Scrolling container` 的滚动偏移量。这样我们才能计算出当前应该显示的标题。但是不监听 scroll 事件的话这是很难做到的。另一个问题是当标题变为 sticky 时它将脱离文档流。

所以不使用滚动事件，我们就无法做到 `Headers` 的 `Sticky mode` 状态切换。


### 添加冗余 DOM 来获取滚动位置  

我们将要使用 `IntersectionObserver` 来代替 `scroll` 事件实现 `Headers` 进入或退出 `Sticky mode`. 给每个 `Sticky section` 的顶端和底端各添加一个个哨兵节点，用来获取滚动位置。当这两个节点进入或离开容器时，他们的可见状态将会发生变化从而触发 `IntersectionObserver`  

![IMAGE]({{ site.gallery_prefix }}2022-04-05-36dfc1f929.gif)  

两个哨兵节点的作用：  
1. `Scrolling down` - 当顶部哨兵节点穿过容器顶端时，`Headers` 变为 sticky  
2. `Scrolling down` - 当 `Headers` 到达 `Sticky section` 底部并且底部哨兵节点穿过容器顶端时，`Headers` 取消 sticky  
3. `Scrolling up` - 当顶部哨兵节点从容器顶端进入容器时，`Headers` 取消 sticky  
4. `Scrolling up` - 当底部哨兵节点从容器顶端进入容器时，`Headers` 变为 sticky  

看下面的屏幕截图来理解上面四个事件发生的过程：  

![IMAGE]({{ site.gallery_prefix }}2022-04-05-443ef7d83c.gif)  

### CSS

哨兵节点是定位在每个段落的顶部和底部的。`.sticky_sentinel--top` 在标题的上方。`.sticky_sentinel--bottom` 在段落的底部：  

![IMAGE]({{ site.gallery_prefix }}2022-04-05-d0e62db99a.jpg)  

```css
:root {
  --default-padding: 16px;
  --header-height: 80px;
}
.sticky {
  position: sticky;
  top: 10px; /* adjust sentinel height/positioning based on this position. */
  height: var(--header-height);
  padding: 0 var(--default-padding);
}
.sticky_sentinel {
  position: absolute;
  left: 0;
  right: 0; /* needs dimensions */
  visibility: hidden;
}
.sticky_sentinel--top {
  /* Adjust the height and top values based on your on your sticky top position.
  e.g. make the height bigger and adjust the top so observeHeaders()'s
  IntersectionObserver fires as soon as the bottom of the sentinel crosses the
  top of the intersection container. */
  height: 40px;
  top: -24px;
}
.sticky_sentinel--bottom {
  /* Height should match the top of the header when it's at the bottom of the
  intersection container. */
  height: calc(var(--header-height) + var(--default-padding));
  bottom: 0;
}
```


### 配置 Intersection Observers 监听  

这种方案的关键点就在于 `IntersectionObserver`. 当 `Scrolling container` 滚动时每个哨兵节点都会使用它来监听自己的可见状态。当有哨兵节点进入或离开可见视图时，我们就知道哪个 header 应该变为 sticky 或取消 sticky 了。

首先，我们建立容器顶部和底部哨兵节点的监听：  

```js
/**
 * Notifies when elements w/ the `sticky` class begin to stick or stop sticking.
 * Note: the elements should be children of `container`.
 * @param {!Element} container
 */
function observeStickyHeaderChanges(container) {
  observeHeaders(container);
  observeFooters(container);
}

observeStickyHeaderChanges(document.querySelector('#scroll-container'));
```

然后，当顶部哨兵节点 `.sticky_sentinel--top` 从 `Scrolling container` 顶端进入视图时触发事件。`observeHeaders` 方法用于创建顶部哨兵节点并且添加到各个段落。`observer` 对象用于监听顶部哨兵节点从顶端进入或离开视图。这将决定每个段落的标题进入 sticky 或取消 sticky.  

```js
/**
 * Sets up an intersection observer to notify when elements with the class
 * `.sticky_sentinel--top` become visible/invisible at the top of the container.
 * @param {!Element} container
 */
function observeHeaders(container) {
  const observer = new IntersectionObserver((records, observer) => {
    for (const record of records) {
      const targetInfo = record.boundingClientRect;
      const stickyTarget = record.target.parentElement.querySelector('.sticky');
      const rootBoundsInfo = record.rootBounds;

      // Started sticking.
      if (targetInfo.bottom < rootBoundsInfo.top) {
        fireEvent(true, stickyTarget);
      }

      // Stopped sticking.
      if (targetInfo.bottom >= rootBoundsInfo.top &&
          targetInfo.bottom < rootBoundsInfo.bottom) {
       fireEvent(false, stickyTarget);
      }
    }
  }, {threshold: [0], root: container});

  // Add the top sentinels to each section and attach an observer.
  const sentinels = addSentinels(container, 'sticky_sentinel--top');
  sentinels.forEach(el => observer.observe(el));
}
```

`observer` 对象使用 `threshold: [0]` 配置，这样当哨兵节点刚进入视图时立刻就会触发回调。

底部哨兵节点 `.sticky_sentinel--bottom` 的监听方式与之类似，另一个 `observer` 对象用于监听底部哨兵节点从底端进入或离开视图。`observeFooters` 方法用于创建底部哨兵节点和添加到各个段落。

```js
/**
 * Sets up an intersection observer to notify when elements with the class
 * `.sticky_sentinel--bottom` become visible/invisible at the bottom of the
 * container.
 * @param {!Element} container
 */
function observeFooters(container) {
  const observer = new IntersectionObserver((records, observer) => {
    for (const record of records) {
      const targetInfo = record.boundingClientRect;
      const stickyTarget = record.target.parentElement.querySelector('.sticky');
      const rootBoundsInfo = record.rootBounds;
      const ratio = record.intersectionRatio;

      // Started sticking.
      if (targetInfo.bottom > rootBoundsInfo.top && ratio === 1) {
        fireEvent(true, stickyTarget);
      }

      // Stopped sticking.
      if (targetInfo.top < rootBoundsInfo.top &&
          targetInfo.bottom < rootBoundsInfo.bottom) {
        fireEvent(false, stickyTarget);
      }
    }
  }, {threshold: [1], root: container});

  // Add the bottom sentinels to each section and attach an observer.
  const sentinels = addSentinels(container, 'sticky_sentinel--bottom');
  sentinels.forEach(el => observer.observe(el));
}
```

而该 `observer` 对象使用 `threshold: [1]` 配置是为了当哨兵节点完全进入视图后才触发回调。

最后，添加两个工具函数用来触发 `sticky-change` 自定义事件并生成哨兵节点：  

```js
/**
 * @param {!Element} container
 * @param {string} className
 */
function addSentinels(container, className) {
  return Array.from(container.querySelectorAll('.sticky')).map(el => {
    const sentinel = document.createElement('div');
    sentinel.classList.add('sticky_sentinel', className);
    return el.parentElement.appendChild(sentinel);
  });
}

/**
 * Dispatches the `sticky-event` custom event on the target element.
 * @param {boolean} stuck True if `target` is sticky.
 * @param {!Element} target Element to fire the event on.
 */
function fireEvent(stuck, target) {
  const e = new CustomEvent('sticky-change', {detail: {stuck, target}});
  document.dispatchEvent(e);
}
```

这样就可以啦。


### 最终的例子

我们创建了自定义事件用来实现监听 `position: sticky` 的触发并添加滚动效果，且不使用 scroll 事件  

![IMAGE]({{ site.gallery_prefix }}2022-04-05-020201e00e.gif)  

[例子](https://xwenliang.github.io/repro/sticky-position-event/sticky-position-event.html) \| [源码](https://github.com/xwenliang/xwenliang.github.io/tree/master/repro/sticky-position-event/sticky-position-event.html)  


### 结论

我经常思考，`IntersectionObserver` 是不是很有希望替代 scroll 事件来实现一些过去许多年一直使用后者开发的 UI 效果。答案是不确定。有很多场景并不适合使用 `IntersectionObserver` 的 API. 但是就像我的上述内容，我们可以用它来实现一些有趣的效果。  

**其他实现样式监听的方案？**  

我们需要的是一种能监听 DOM 样式改变的方式。但是很不幸，目前 web 端没有任何 API 能实现。  

`MutationObserver` 或许是个可选项，但大部分场景都监听不到。就像它自己的例子，当 sticky 这个 class 被添加到元素上时才会触发回调，而不是当元素的计算样式(computed style)发生改变时触发。并且 sticky 这个 class 当页面加载后就已经存在了。  

未来或许一个名为 "Style Mutation Observer" 的监听器可以监听到元素计算样式的改变，像 `position:sticky`.  


> 翻译自：https://developer.chrome.com/blog/sticky-headers/  

