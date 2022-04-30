---
layout: post
title: window.opener 带来的隐患
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-11-03 18:12:53+0800
orig_link: https://xwenliang.cn/p/5457012137c357d37f000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


今天楠哥做组内分享的时候，提到了 window.opener 这个邪恶的东西，在这里记录下。  

先介绍下这东西是个啥，他是打开你当前窗口的父窗口，举个例子：你从百度搜索你的博客，然后从搜索结果页进入了你的博客，那么现在你博客的 window.opener 就是百度的搜索结果页的窗口。  

它可以用来干啥呢，既然它也是个 window 对象，那也应该有 location 等等这些属性，并且 window.opener.location 只可写，不可读。既然可写，那可以利用它修改父窗口的地址吗？尝试在通过百度打开的你的博客的控制台中输入：  

`window.opener.location = 'https://xwenliang.cn';`  

运行后发现，父窗口的地址真的被改变了...  

设想如下场景：有个很出名的网站 X 上面有我网站的入口，我找到可以进入我网站的页面，伪造一个跟该页面一模一样的页面，然后用户通过网站 X 进入我网站的时候，将打开网站 X 的窗口地址篡改为我伪造页面的地址，然后诱导用户登录...  

如何解决这个隐患呢？  

`<a href="第三方网址" target="_blank" rel="noreferrer">第三方网址</a>`  

这样就可以避免第三方网站通过 `window.opener` 来篡改父窗口地址了。  

但同时会丢失掉 refer, 第三方网站将不能通过 `document.referrer` 来获取来源地址了。  

