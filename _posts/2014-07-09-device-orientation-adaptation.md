---
layout: post
title: 移动设备横竖屏之终极解决方案
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-07-09 15:17:45+0800
orig_link: https://xwenliang.cn/p/53951e924093e67742000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


移动开发项目中，我们经常会遇到一个蛋疼的横竖屏切换问题，因为浏览器不像 Native 可以自主控制是否允许横竖屏切换。只能同时兼容它横屏和竖屏下的样式了。  

要实现区分横竖屏样式，可以有两种方式：  

1.利用高级浏览器的 `window.orientation` 属性和 `onorientationchange` 事件，实时监听横竖屏。

`window.orientation` 属性给出了当前浏览器的屏幕方向，`0` 是正常的竖屏状态，以此为基准，`90` 是左转 `90` 度横屏，`-90` 是右转 `90` 度横屏。然后旋转 `180` 度后的上下颠倒，目前本人手机还不支持(iOS7.1 & Android4.4). `onorientationchange` 事件，就像普通的 `click` 事件一样，不过是在屏幕发生旋转的时候会触发。结合这两者，我们可以想象，给 `window` 添加 `onorientationchange` 事件监听，然后在回调中判断 `window.orientation` 的值，就可以区分出横屏、竖屏了。  

那么对于不支持这两个东西的普通浏览器(例如 chrome 的模拟内核，就不支持..)如何做到区分横竖屏呢？之前我想到的方法是利用 `onresize` 事件，然而某些傻逼浏览器，在上下滑动的时候居然也会频繁触发这个事件。直到后来发现了更好的方法：实时的对比屏幕当前的宽高 `window.innerWidth` 和 `window.innerHeight`. 如果前者大于后者，说明是横屏状态，相反则为竖屏状态。  

2.利用 media query 实现横竖屏样式控制：  

```css
@media all and (orientation: landscape){
    xxxx
}
@media all and (orientation: portrait){
    xxxx
}
```

上面和下面分别对应横竖、竖屏下的样式。  

iOS 横屏时还有个字体变大的问题，可以通过以下样式解决：  

```css
    .some-class{
        -webkit-text-size-adjust: none;
    }
```

