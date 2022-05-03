---
layout: post
title: chrome 控制台的 console.log 输出有时候很坑爹
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-01-17 12:21:40+0800
sync_link: https://xwenliang.cn/p/52cbc87014e98b7623000011
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


今天同事遇到一个问题，简单描述如下：在用 `console.log` 打印某个对象 (a) 和这个对象的属性 (a) 的时候(同时打印)，查看对象 a 时发现确实有 a 这个属性，但当时打印的却是 undefined, 这是为啥呢？  

先看这段代码：  

```javascript
var a = {b: 2, c: 3, d: 4, e: 5, f: 6, g: 7};
console.log(a);
a.a = 1;
```

大家猜猜，在控制台的输出中查看 a 这个对象，它会有 a 属性吗？答案是，有时候有，有时候没有...  

先来说说 `console.log` 的几种行为：  

1. 当打开带有上面代码的页面时，如果未提前开启控制台，代码运行完毕后又开启了控制台，那么只能看到输出一个 object 和它前面的小三角。这时候点开这个小三角，会发现 a 这个对象上确实有 a 这个属性。  

    ![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-05-03-967cac0886.jpg)  

    ![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-05-03-9f4e92fe44.jpg)  

2. 当打开带有上面代码的页面时，开启了控制台，或者开启控制台再刷新几下页面，会看到一个输出一个 object 和它的 5 个属性还有它前面的小三角以及后面的省略号，这时候直观的看，并没有 a 这个属性，但是点开小三角会发现它也有 a 这个属性。  

    ![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-05-03-2711a083c7.jpg)  

    ![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-05-03-215d67ca6d.jpg)  

3. 在 2 的情况下，减少 a 的属性的个数，使其小于 5 个，以 3 个为例。这时候会输出一个 object 和它的全部 3 个属性，并且它前面不会有小三角，这时候我们发现，没有 a 这个属性了...  

    ![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-05-03-5d87789096.jpg)  

通过上面的例子，我们发现当我们点对象前面的小三角的时候，浏览器会去这个 `console.log` 的上下文中重新查询这个 object, 把它所有的属性都给罗列出来..而并不是只打印了 `console.log` 当时的状态...  

所以我们在用 `console.log` 打印对象的时候，尤其是其属性比较多会产生小三角的时候，点击这个小三角所罗列出来的 a, 并不是当时打印的时候的状态。换句话说，点击小三角所看到的属性，并不能作为当时这个对象含有这个属性的凭证...应该打印 `a.a` 才能确定...  

其实人家大 chrome 也给出提示啦，看看点击这个小三角的时候，右方会出现一个小叹号，鼠标放上给出了这样的提示：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-05-03-a889e94562.jpg)  

大致意思是：下面的这些属性，是在这个对象被扩展的时候获取到的。数组也有同样的问题。(不明白 first 是啥意思，我试过，扩展后再改变 a 的值，打印的 a 还是改变后的值，我也试过扩展后再删除 a 这个属性，打印结果也就没有 a 这个属性了)  

上面提到的问题，还引发了另外一个问题。细心的同学会发现，在上面的 2 中，点击小三角查看 a 的属性的时候，发现 a 这个后添加的属性，排在了所有属性的前面，这是否说明：js 中对象的属性是无序的呢？且看[下一篇](https://xwenliang.github.io/frontend/2014/02/24/order-of-object-keys-in-javascript.html)  

