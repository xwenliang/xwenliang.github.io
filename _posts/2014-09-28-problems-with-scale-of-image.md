---
layout: post
title: 图片放大抖动的内在原因及解决方法
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-09-28 14:10:38+0800
sync_link: https://xwenliang.cn/p/542251406ef62a8001000002
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最近百度视频首页改版，小伙伴们给作品海报添加了一个 hover 效果，就是鼠标划入的时候，海报会放大一些，划出的时候，海报再缩小回原来的大小。具体实现也挺容易的：  

```css
a img{
    -webkit-transition: all .05s ease-in;
}
a:hover img{
    -webkit-transform: scale(1.05);
}
```

其他前缀的就不写了，本来效果也挺好的，但是 pm 同学发现，每次图片放大之后，该图片都会抖一下。  

后来仔细对比发现，「抖」的这一下，实际上是让图片变清晰了，但是不仔细看的话，整体感觉就是：图片放大之后还要抖一下。感觉着实让人不爽。  

后来发现，有一条属性可以在图片放大后，不再让图片变清晰，这样也就解决了图片的抖动问题了，该属性是：`-webkit-backface-visibility: hidden;`  

这条属性的本意是：**隐藏被旋转的元素的背面**，但它为何能阻止浏览器补间像素使放大的图片变清晰，就不得而知了...  

