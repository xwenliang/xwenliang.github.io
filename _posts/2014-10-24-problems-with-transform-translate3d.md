---
layout: post
title: transform:translate3d 开启硬件加速？请慎用！
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-10-24 17:01:19+0800
orig_link: https://xwenliang.cn/p/5406909e058363192b00022d
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


网上关于使用 `transform: translate3d` 来开启硬件加速，使 GPU 提升性能的帖子已经泛滥了，但是我在实际项目中却被这个所谓的硬件加速坑出了翔。  

实际场景如下：项目中的交互效果非常复杂，节点也异常的复杂，并且给大多数节点(不管有没有动画)加上了 `transform: translate3d` 后来却发现，所有动画都变的卡顿不堪。去掉该属性之后，动画反而更顺畅，说好的开启硬件加速，提高性能呢？  

猜想原因可能如下：  

给过多的节点开启了硬件加速，会导致 GPU 负载严重，从而使性能急剧下降，导致动画卡顿，甚至页面短时间内失去响应。  

