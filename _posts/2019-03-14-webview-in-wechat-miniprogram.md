---
layout: post
title: 微信小程序 web-view 组件的坑
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2019-03-14 15:44:45+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最近在做一个活动时候，需要将 H5 页面嵌入别人家的小程序中，正常微信环境中我们会通过在分享链接拼接参数的方式，来获取微信用户的分享关系，然而在小程序中分享的地址是小程序自己的 path, 其他用户点击的时候会直接进入小程序的这个 path, 所以 H5 就不能直接获取到用户的分享关系了。  

那么怎么实现呢？思路是挺简单的：  
1. H5 将需要拼接在分享链接上的参数，通过 `wx.miniProgram.postMessage` 发送给小程序   
2. 小程序在分享动作触发的时候获取到该参数，然后拼接到分享的 path 上  
3. 其他用户点击分享的小程序链接，通过 `onLoad` 函数的参数取到拼接到 path 上的参数  
4. 小程序将 path 上的参数，拼接到 web-view 的 url 上  
5. web-view 中的 H5 通过 url 获取到该参数  

这样就完成了 H5 分享链接参数的透传，那么在实际操作中我们遇到了哪些问题呢？  
1. 小程序只有在分享动作触发(页面销毁、回退不符合场景)的时候才能得到 H5 发送过来的参数，此时再去设置分享的 path 会不会太迟？经过测试后发现并不迟，可以实现  
2. 其他用户点击分享的小程序链接，在 `onLoad` 函数中拿到参数再去动态设置 web-view 的 url, 会不会不生效？这一点经过测试后确实发现了问题：微信版本7.0.0不生效，7.0.3生效  

找遍了微信小程序的文档也没有看到相关的内容，只是提到了若有中文字符需要 encode:  
> “避免在链接中带有中文字符，在 iOS 中会有打开白屏的问题，建议加一下 encodeURIComponent”  

网上搜了一会，发现最早有在2017年就做过此类需求的帖子，那不可能是微信到了7.0.3(发布日期2019年2月)才实现的这个需求，所以一定是踩到了某种 bug, 然后微信在7.0.3版本修复了。

那么到底是什么 bug 呢？仔细看了我的 url, 发现并没有中文字符，但是有个 `{}`, 是它的问题吗？对整个 url 进行了 `encodeURI` 后发现确实可以了，所以并不是动态设置 url 不生效，而是 url 中含有特殊字符导致了 web-view 拒绝加载该 url  

iOS 开发的同学们都知道 UIWebview 和 WKWebview 加载 url 的时候要先使用 [stringByAddingPercentEncodingWithAllowedCharacters](https://developer.apple.com/documentation/foundation/nsstring/1411946-stringbyaddingpercentencodingwit?language=objc) 进行 [percent-encoding](https://en.wikipedia.org/wiki/Percent-encoding#Percent-encoding_reserved_characters), 微信在7.0.3之前应该都没有做这个处理，所以加载不了带有特殊字符的 url, 特殊字符指的是 `A-Za-z0-9;,/?:@&=+$-_.!~*'()#` 以外的其他所有字符([RFC2396](https://www.ietf.org/rfc/rfc2396.txt))  

