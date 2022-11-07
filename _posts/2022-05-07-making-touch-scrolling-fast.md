---
layout: post
title: 让页面的滚动更流畅
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2022-05-07 04:48:07+0800
sync_link: https://xwenliang.cn/p/627589870965f70e49fb9a5b
# 原文发表时间 和 原文链接
orig_date: 2017-01-10
orig_link: https://developer.chrome.com/blog/scrolling-intervention/
categories: translation
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


我们知道移动端页面的滚动响应对于用户体验来说至关重要，但是触发页面滚动的 touch 事件监听器往往会导致严重的滚动性能问题。Chrome 已经通过允许将 touch 事件监听器设置为 [passive](https://developer.chrome.com/blog/passive-event-listeners/)(给 `addEventListener()` 传递 `{passive: true}` 参数) 并传递 [pointer events](https://developer.chrome.com/blog/pointer-events/) API 来解决了这个问题。这些新特性对于推动不阻塞页面滚动的新模式具有重大意义，但是开发者有时候会很难理解和适应。  

我们相信 web 应该默认就是很快的，并不需要开发者理解浏览器晦涩难懂的实现细节。Chrome 56 版本中我们在一些开发者最经常遇到的场景中设置了 [touch 事件监听器默认为 passive](https://chromestatus.com/feature/5093566007214080). 这么做可以显著的提高网站的用户体验并且带来非常小的影响。  

在极少数情况下这会导致非预期的滚动。给不需要滚动的元素设置 `touch-action: none` 样式通常是更为简单的做法。如果想知道你的网站是否被影响了，应该怎么做，请继续阅读。  

### 背景：Cancelable Event 让你的页面变慢了  

<div class="iframe-youtube"><iframe loading="lazy" src="{{ site.gallery_prefix }}2022-05-06-40b9eb166e.mp4"></iframe></div>  

如果在 `touchstart` 或者首个 `touchmove` 事件监听器中调用了 `preventDefault()` 就会阻止页面滚动。问题是绝大部分的监听器并不会调用 `preventDefault()`, 然而浏览器仍然需要等待事件监听器执行结束来确保没有调用。"passive event listener" 就是用来解决这种场景的。当给上述两个事件监听器的第三个参数传递了 `{passive: true}` 对象，这就告诉浏览器该事件监听器中不会调用 `preventDefault()` 可以放心的滚动而不必等待事件监听器的执行。示例代码：  

```js
window.addEventListener('touchstart', func, {passive: true});
```

### 改进措施  

我们的主要动机是当用户触摸屏幕时尽量减少刷新屏幕所耗的时间。为了理解这种场景下的 `touchstart` 和 `touchmove` 打断滚动行为有多频繁，我们添加了测量指标。  

我们查看了根对象( window, document 或 body )接收到的 Cancelable touch 事件占比发现 80% 的事件监听器都是符合 passive 标准但是并没有这么去注册的。鉴于这种情形，我们发现通过设置这些事件监听器默认为 passive 可以在不影响到任何开发者的情况下极大的提高滚动性能。  

这让我们执行了以下举措：如果 `touchstart` 或者 `touchmove` 事件监听器的对象是 `window`, `document` 或者 `body` 的话，我们默认将 `passive` 设为 `true`. 这意味着下面的代码：  

```js
window.addEventListener('touchstart', func);
```

将默认等于：  

```js
window.addEventListener('touchstart', func, {passive: true});
```

现在再在事件监听器中调用 `preventDefault()` 将会被忽略。  

下面的图表展示了从用户首次触摸屏幕到屏幕更新的时间，数据来源于 Android Chrome 中的所有网站。在改进措施生效之前这个时间超过了 400ms, 而现在在 Chrome 56 Beta 中减少到了 250ms, 降低了 38%. 将来我们希望把所有的 `touchstart` 和 `touchmove` 的事件监听器都默认设置为 `{passive: true}`, 这样能把时间降低到 50ms.  

![IMAGE]({{ site.gallery_prefix }}2022-05-07-40e55bf027.png)  

### 不兼容和修复指引  

在绝大多数情况下这不会导致任何的不兼容。产生问题最常见的场景是你不需要页面滚动的情况下却滚动了。还有一种场景是触发了意料之外的 **click** 事件(当 `touchend` 事件监听器中忘记写 `preventDefault()` 时)  

Chrome 56 和之后的版本中，如果在 `{passive: true}` 的监听器中调用 `preventDefault()`, 将会在控制台输出以下警告：  

> touch-passive.html:19 Unable to preventDefault inside passive event listener due to target being treated as passive. See https://www.chromestatus.com/features/5093566007214080  

在应用中也可以通过检查 [defaultPrevented](https://developer.mozilla.org/zh-CN/docs/Web/API/Event/defaultPrevented) 属性来查看是否调用了 `preventDefault`  

我们发现绝大部分受影响的页面都可以相对简单的通过设置 [touch-action](https://developer.mozilla.org/zh-CN/docs/Web/CSS/touch-action) 样式来解决。如果你想阻止某个元素所有的滚动和缩放，可以给它设置 `touch-action: none`. 如果你有一个水平方向的轮播图可以通过设置 `touch-action: pan-y pinch-zoom` 来实现用户垂直方向的滚动和缩放。正确使用 `touch-action` 在支持 `Pointer Events` 且不支持 `Touch Events` 的 pc 浏览器上同样是有必要的，像 Edge 浏览器。而移动端 Safari 和一些老的不支持 `touch-action` 的移动端浏览器则仍然需要调用 `preventDefault`, 虽然 Chrome 会忽略它。  

在更复杂的场景中可能需要注意以下几点：  

- 如果 `touchstart` 监听器中调用了 `preventDefault`, 确保成对的 `touchend` 监听器中也要调用它来阻止 click 事件或其他 tap 事件的触发。  

- 给 `addEventListener` 的第三个参数传递 `{passive: true}` 来覆盖默认行为(不建议)。但要确保浏览器支持 [EventListenerOptions](https://github.com/WICG/EventListenerOptions)  

### 总结  

在 Chrome 56 版本中很多网站的滚动响应速度更快，这是关于这次改动众多开发者们注意到的事情。在一些场景中开发者可能还遇到了意料之外的页面滚动。  

尽管在移动端 Safari 仍然需要在 `touchstart` 和 `touchmove` 监听器中调用 `preventDefault`, 但我们不应该依赖它，因为在 Chrome 中这不一定会奏效。开发者们更应该使用元素的 `touch-action` 样式来在任何触摸事件发生前就告诉浏览器它是禁止滚动和缩放的。要在 `touchend` 监听器中调用 `preventDefault` 来阻止点击事件的触发(像 click 事件)  

> 翻译自：https://developer.chrome.com/blog/scrolling-intervention/  

