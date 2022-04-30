---
layout: post
title: margin-top 折叠
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-08-22 12:13:36+0800
orig_link: https://xwenliang.cn/p/53f6c2d8058363192b000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


假设 b 是 a 的子节点，如果这时候对 b 设置 `margin-top: 10px`, 那么 a、b 的 `margin-top` 将会折叠在一起，产生的效果是 a 会 `margin-top: 10px`, b 没有效果:  

```html
<style>
    .b{
        margin-top: 10px;
    }
</style>

<div class="a">
    <div class="b">
</div>
```

为什么叫做「折叠」呢？因为如果你将 b 设置 `margin-top: 10px` 的同时，将 a 设置 `margin-top: 5px`, 那么效果跟上面只将 b 设置 `margin-top: 10px` 是同一个效果。也就是说，将 a、b 的 `margin-top` 折叠在了一起。  

那么折叠规则是什么呢？会取其大者。如果 a、b 都设置 `margin-top`, 会取其大者，将其应用于 a. 详细规则见 [Box model](http://www.w3.org/TR/CSS21/box.html#collapsing-margins)  

显然我们是想让 b 元素 `margin-top` a 元素，而不是让他们俩一起 `margin-top`. 看了上面的详细规则后，我们得出以下解决方案：  

1. 对 a 设置 `float`  
2. 对 a 设置 `overflow`(取值 visible 除外)  
3. 对 a 设置 `position: absolute/fixed`  
4. 对 a 设置 `display: inline-block`  
5. 对 a 设置 `border`  
6. 将 b 前面插入同级非空节点  

