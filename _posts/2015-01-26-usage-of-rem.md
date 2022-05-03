---
layout: post
title: rem — 前端狗的福音
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-01-26 03:03:52+0800
sync_link: https://xwenliang.cn/p/54c222aec8dd347c05000008
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


近期看到淘宝的移动端改版了，使用了 rem 这个神奇的单位。  

这货看上去跟 em 长的颇为相似，但它是 font size of the root element, em 只是 font size of the element, 显然 rem 是 em 的升级版啊。  

我们在用 em 的时候，它是相对于父元素字体大小的单位，这点让我们很不爽，很容易出现 `1.2em*1.2em` 的情况，但是 rem 却是相对于根元素 (html) 的字体大小的单位，这样就可以避免上面的问题了。  

那么问题来了，这货用来做移动端适配是不是很合适？然后我们扒一扒移动端适配的几种方式：  

1. 流式布局：宽度使用百分比，高度定死，这样很容易出现图片变形的情况，你懂得。尝试 `background-size: cover` 也是各种坑，并且效果只能说是差强人意。  

2. 固定宽度：用 pc 时代的思想来做，你不是尺寸多嘛，我搞个 wrap, 宽度设置 320, 然后 `margin: 0 auto;` 这种方法在 5.5 寸大屏上的效果，只能用呵呵来描述了。  

3. 响应式：老外们喜欢用，但是我一直觉得这是个伪命题。很多人用它是为了 pc、移动端共用一个页面。简而言之，就是懒。(目前本博客就是采用了这个懒法子)  

4. 设置 viewport: `<meta name="viewport" content="width=320,maximum-scale=2,user-scalable=no">`, 这样，在 320px css 逻辑像素的设备下，就不对页面缩放，否则的话进行 `device-width/320` 倍的缩放，这样也可以勉强适配，但是是整个页面都被放大了，很容易出现图片变虚的情况。  

5. 我们的 rem 登场了。它跟第 4 种方式类似，都是先假设设备的尺寸就是 320 (当然也可以是其他值)，然后在这个尺寸下切图，设定各个元素针对该尺寸下的相对宽高。当屏幕变宽变窄的时候，各个元素也跟着放大缩小相应的倍数，这样理论上就可以完美适配所有尺寸了。  

等等，第 5 种跟第 4 种有什么区别吗？区别还是有的，第 4 种是粗暴的将整个页面放大/缩小,但是第 5 种是可选的...只要将不需要跟随设备屏幕缩放的元素，使用 px 即可...  

使用的时候，为了避免 chrome 对小于 12px 字体自动调整，建议给 html 设置 12px 以上的字号...  

