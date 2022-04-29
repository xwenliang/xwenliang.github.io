---
layout: post
title: 喷一喷 box-flex
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-02-26 18:30:36+0800
orig_link: https://xwenliang.cn/p/54da0f5f861bdd1d5e000002
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


今天让这个属性坑的满地打滚，w3c 这样描述道：  
  
![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-30-9aacbea8ec.jpg)  

但事实真的是这样的吗？看下图：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-30-1ecea1c21c.jpg)  

我们发现，除了左右比例根本不是说好的 1:2 之外，这个比例还会随着容器内容的多少而变化，我书读的比较少，顿时茫然了。  

后来发现，再给他们各自设置 width: 0, 才会真正的按 1:2 分配宽度。既然这个属性有问题，我们为什么不用更好的 display: flex 呢？  

这才是真正的坑啊，大部分安卓机(尤其小米)，根本不认识 display: flex 是什么，甭管你加了什么样的前缀...好在他们还能认识加了前缀的 display: box, 再配上 width: 0, 这个问题就完美解决了。  

砖头：  

```less
//mixin
.flex(){
    display: -webkit-box;
    display: -moz-box;
    display: -ms-box;
    display: -o-box;
    display: box;
    display: -webkit-flex;
    display: -moz-flex;
    display: -ms-flex;
    display: -o-flex;
    display: flex;
.flex-children(@value: 1){
    -webkit-box-flex: @value;
    -moz-box-flex: @value;
    -ms-box-flex: @value;
    -o-box-flex: @value;
    box-flex: @value;
    -webkit-flex: @value;
    -moz-flex: @value;
    -ms-flex: @value;
    -o-flex: @value;
    flex: @value;
    width: 0;
}
//使用
ul{
    .flex();
    li{
        .flex-children(1);
    }
    li.double{
        .flex-children(2);
    }
}
```

