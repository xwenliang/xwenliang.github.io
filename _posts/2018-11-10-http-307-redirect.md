---
layout: post
title: http 请求被 307 到 https
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2018-11-10 21:51:49+0800
sync_link: https://xwenliang.cn/p/5be6e275469f887b71000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


## 问题复现  
1. 先访问 `https://a.com`, 该网页 JS 会请求 `https://api.a.com` 接口  
2. 再访问 `http://a.com`, 该网页 JS 会请求 `http://api.a.com`, 但是查看网络请求发现，`http://api.a.com` 被强制 `307` 到了 `https://api.a.com`  

经过排查发现，这是命中了浏览器的 [HSTS](https://www.chromium.org/hsts/) 策略，即：  

> 一切能通过 https 访问的网址，都用 https 来访问  

「能通过 https 访问的网址」怎么定义呢？那就是你曾经访问过该网址的 https 链接(当然可以通过清除浏览器历史记录来骗过浏览器，但你的用户可能不知道这个操作)  

## 问题解决  
- server 端重定向用户访问的 `http` 链接到 `https`  
- 如果必须允许用户访问 `http` 链接，则服务端接口针对 80 端口请求做跨域支持，因为跨端口也是跨域  

## 307 从何而来，是个什么东西呢  
经过使用 `chrome://net-internals/` 追踪发现，是浏览器自己返回的：  

```c++
URL_REQUEST_REDIRECT_JOB
    --> reason = "HSTS"
t=24613 [st= 2]  URL_REQUEST_FAKE_RESPONSE_HEADERS_CREATED
    --> HTTP/1.1 307 Internal Redirect
        Location: https://api.a.com
        Non-Authoritative-Reason: HSTS
        Access-Control-Allow-Origin: http://api.a.com
        Access-Control-Allow-Credentials: true
```

[这里是 307 状态码含义的解释](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307)  

