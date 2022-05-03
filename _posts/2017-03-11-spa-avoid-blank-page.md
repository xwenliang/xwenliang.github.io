---
layout: post
title: 单页面 web 应用避免白屏
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2017-03-11 12:51:18+0800
sync_link: https://xwenliang.cn/p/58c38246c088f2da3700000b
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


ajax 的兴起给 web 开发带来了新思路，彻底划清了前后端开发的界线，一些优秀单页面 SPA 也应运而生，然而事情的发展总是有两面性的，单页面应用同样也会有些缺陷，如不利于搜索引擎抓取，首页白屏等，本篇将着重对第二个问题进行分析、解决。  

单页面应用的交互方式决定了页面打开伊始是没有数据的，当然也可以进行优化，像本博客采用的方案，后面会说到。首次打开大部分的单页面应用都会发现，做的差一点的会是先白屏，好一些的会给 loading 提示，但这也没有多大的意义，页面本身虽然加载完了，由于数据接口的滞后导致了页面仍然不可用。有没有什么解决办法呢，比如让首屏依赖的数据「提前到达」。  

我们想到了 `<script>` 标签的时序性，如果在单页面程序的 `<script>` 标签前插入一个 `<script>` 标签，而这个标签指向了首屏数据接口，后台按照 jsonp 的约定方式返回，是不是就可以「同步」的取回该数据了？  

像这样：  

```html
<script>
    function jsonp_callback(jsonp_data){
        window.jsonp_data = jsonp_data;
    };
</script>
<!-- 下面是用于取数据的标签 xxx接口返回 'jsonp_callback({a: 1, b: 2})' -->
<script src="xxx"></script>
<!-- 使用数据 -->
<script>
    console.log(jsonp_data)
    //{a: 1, b: 2}
    </script>
```

虽然这样做从代码层面来讲并不完美，引入了两个全局变量，但确实把首页白屏的问题解决掉了。然而有时候这还是不够的，比如这个首页数据的接口可能需要一些参数，如果是简单的常量我们可以直接拼在 url 后面，但如果需要动态获取，该怎么处理呢，比如拿当前页面的 url? 动态创建 script 标签然后 append 到 head, 这显然是不行的，因为这样创建的标签会最后执行。  

我们又想到了 `document.write` 的阻塞性，通过该方法动态的写入 script 标签，这个问题似乎就解决了：  

```html
<script>
    function jsonp_callback(jsonp_data){
        window.jsonp_data = jsonp_data;
    };
    //xxx接口返回 'jsonp_callback({a: 1, b: 2})' 
    document.write('<script src="xxx"><\/script>');
</script>
<script>
    console.log(jsonp_data);
    //{a:1, b: 2}
</script>
```

`document.write` 的使用一定要小心，他可能会带来很多意料之外的结果：  

比如把 `console.log(jsonp_data)` 放进第一个 script 标签的末尾，能正确的拿到数据吗？  
显然是不能的，因为此时虽然 `document.write` 会阻塞代码继续往下执行，直到把内容 write 完毕，但由于 script 标签的时序性，需要远程加载内容的 script 标签并不会立即执行，它会等到它上面的所有 script 标签依次执行完毕后才会执行。  

再比如，上面的 `document.write` 直接输出接口内容，再把 `console.log(jsonp_data)` 放到它后面，可以正确的拿到数据吗：  

```html
<script>
    function jsonp_callback(jsonp_data){
        window.jsonp_data = jsonp_data;
    };
    document.write('<script>jsonp_callback({a: 1, b: 2})<\/script>');
    console.log(jsonp_data);
</script>
```

答案是可以的，因为 `document.write` 里面的内容会立即执行，或许这么说有些牵强，等到找到具体资料再补充吧。  

该解决方案基本不需要服务端过多的支持，只需要把接口做成支持 jsonp 的方式即可。  

上面还提到了本博客的解决方案：pushState+后端渲染首屏，大致的结构是这样的：  
用户初次访问会通过后台直接渲染，后续的跳转用 pushState+ajax 实现。  

这样做的好处是用户访问的任何页面都可以直接到达，无需等待 ajax 加载。  

坏处也很明显：后台需要把用户所有可能触达的页面全部在后台准备一份，等待用户的「初次访问」，还需要把所有数据做成接口，等待用户在前端跳转时发起的 ajax 请求。对后端来说开销确实很大，不过本博客采用了相同的前后端模板，只需要在后端分配好路由即可，所有数据一式两份，一份输出到页面，一份做成 ajax 接口。  

或许这就是 node 的方便之处吧，它「更懂得前端需要什么」  

