---
layout: post
title: 解决滚动条引起的页面抖动
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-08-11 23:32:26+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


之前博客的切页效果有些瑕疵，比如页面滚动条位置保存的不太好，并且还原滚动条位置的时候页面会动一下，再比如切换页面，如果当前页面已经往下拉了一段距离，再切到下个页面的时候，切页动画会扭曲的很厉害，并且切到下个页面也会抖一下。想想也是有原因的，视角已经和旋转的中心点不在一个水平面上了。  

设想过几种解决方案，最终决定不使用公共的滚动条，转而一个 view 使用一个独立的属于该 view 的滚动条。这样只要这个 view 被保存下来了，滚动条位置自然就保存下来了。并且旋转的盒子可以是一个固定高度的容器了，内容的滚动放到各个面里。  

于是开始搞，整的差不多之后发现，使用这种方案，页面切换的时候会带着滚动条一起切换，奇丑无比，难以接受。于是又设想，可不可以切换页面的过程中隐藏掉滚动条，切换完了之后再显示出来。  

这种方案实施完之后发现，在显示隐藏滚动条的过程中，页面会发生抖动...这显然更难以接受。又折腾了良久，设想可不可以获取到滚动条的宽度，隐藏滚动条的时候来个 margin-right 这个宽度。折腾完之后，终于算是差强人意了。  

获取滚动条宽度时用了一个小技巧：  

```javascript
//默认已经引入了jQuery之类的玩意
var $html = $('html');
//获取带滚动条的html的宽度 
$html.css('overflow', 'scroll');
var scrollWidth = $html.width();
//获取不带滚动条的html的宽度 
$html.css('overflow', 'hidden');
var hiddenWidth = $html.width();
//两者之差就是滚动条的宽度 
var scrollBarWidth = hiddenWidth - scrollWidth;
```

费了很大劲重新跑起来了当时的版本，效果如下图：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-29-514fc17f94.gif)  

