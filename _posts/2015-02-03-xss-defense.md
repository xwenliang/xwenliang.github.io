---
layout: post
title: xss 初级防范
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-02-03 11:42:57+0800
orig_link: https://xwenliang.cn/p/53c4fef992e6d4e93e000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最近发现，自己博客上所有用户可以输入的地方，都可以被 xss...  

真是不忍直视啊，多亏各位手下留情了(其实是没几个人看)。于是抽空把这个洞堵上了，堵之前先去看了看别人博客是怎么做的，发现大多差强人意，输入 `<script>` 后，要么直接啥都不显示，要么只显示 `script`, 那如果用户就是想输入 `<script>` 的话，就只能使用 html 编码了：`&lt;script&gt;`  

这简直不能容忍啊，本来该你去做的事情，为什么要让用户承担...并且要做到简单防范的话，只需要将 `<>` 在前后端都转译一下，不就万事大吉了么，没有了他们俩，几乎不会有其他什么东西能被解析为 dom 结构了吧，并且 `&lt;&gt;` 被 html 解析出来之后还是 `<>`, 丝毫不会影响用户的输入。  

[相关文档](http://114.xixik.com/character/)  

```javascript
function fuckXss(str, reg){
    var re = reg || /\<|\>|\\|\/|\"|\'/ig;
    return str.replace(re, function($1){
        return '&#' + $1.charCodeAt() + ';';
    });
};
```

