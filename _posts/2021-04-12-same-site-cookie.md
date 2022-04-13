---
layout: post
title: 跨域 cookie 二三事
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2021-04-12 04:17:23+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


web 开发发展到现在，前端和后端几乎已经完全分离了，不仅部署的环境分离，很多时候域名也是分离的。今天主要讨论一个不同域名下前后端交互所带来的问题。

---  

我们先来看看 cookie 的写入规则：  
当浏览器接收到请求返回时，会尝试解析 response header 中的 [`Set-Cookie`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie) 字段，它的构成一般是这样的：  
```
Set-Cookie: a=1; domain=xwenliang.cn; path=/a; max-age=60; samesite=none; secure; httponly;
```
上面这行表示浏览器应该写入一条：  
键名为a，键值为1，`xwenliang.cn`及其子域名在 `/a` 及其子路径下才可以读取的，有效期为 60 秒的，允许跨站读取的，只允许 https 环境的，不允许开发者读取的 cookie.  

---  

根据上面的规则，假如有两个子域名，例如：  
`a.xwenliang.cn`  
`b.xwenliang.cn`  
我们可以在写入 cookie 的时候通过设置 `domain=xwenliang.cn` 直接写入根域名下，如此一来所有子孙域名都可以获取该 cookie. 与之类似的属性还有 `path`, 将 cookie 写入根路径 `path=/`, 其他所有子孙路径才可以获取该 cookie.  

细心的同学可能会发现，有些 cookie 的前缀是有个 . 的，那有没有这个点代表什么意思呢？[RFC6265](https://tools.ietf.org/html/rfc6265#section-4.1.2.3) 中详细解释了 cookie 的使用规范，其中就有对这个 . 的解释：有 . 代表允许子孙域名使用，没有 . 代表只允许当前域名使用不允许其他任何域名使用。
那么如何设置带不带这个 . 呢？这是浏览器的默认行为，如果 `Set-Cookie` 中明确带有 `domain` 声明，那设置的 cookie 就是带 . 的，如上面设置了 `domain=xwenliang.cn` 之后，浏览器写入的 cookie 就是 `.xwenliang.cn` , 如果不设置该声明，那写入的 cookie 只会是当前地址的 host，也就是 `xwenliang.cn`.  

---  

那么假如前端部署在 `a.xwenliang.cn`, 后端部署在 `b.xwenliang.cn`, 我在页面上直接发起对后端的请求，cookie 能被带上吗？毕竟我 cookie 是设置在 `xwenliang.cn` 下的。

答案是不能。并且后端设置的 cookie 也会被忽略。

在 `a.xwenliang.cn` 直接发起对 `b.xwenliang.cn` 带有同源策略限制的请求，如 XMLHttpRequest 或 fetch 请求，是无法携带任何 cookie 的，包括 domain 设置为根域名 `xwenliang.cn` 的 cookie, 要想携带 cookie 需要使用  [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#requests_with_credentials). 而 script、img 等非同源策略限制性标签发起的请求则可以直接携带根域名下的 cookie.  

同样 `a.xwenliang.cn` 发起的带有同源策略限制的请求，`b.xwenliang.cn` 也是无法直接写入 cookie 的。要想写入也需使用  [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#requests_with_credentials) 或者使用 script、img 等非同源策略限制性标签发起的请求。

想想我们为什么不使用 script、img 等这些没有同源策略限制的标签来管理跨域 cookie 呢？正是因为他们没有同源策略限制，我们无法限定它们的使用范围。

---  

以上这种情形，早在 2019 年之前，是可以通过设置 [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#requests_with_credentials) 来解决的，但这种行为很可能会被恶意利用，比如第三方广告追踪，所以各大厂商纷纷提出要制裁这种方案。

[web.dev](https://web.dev/samesite-cookies-explained/) 提出了过渡方案 [samesite](https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00), 只有设置了 [`samesite=none`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite#none) 的 cookie, 才能被上述方案读取。  

Google Chrome 最早于 2020 年 2 月 推出的 Chrome 80 默认启用了该设置，如果要取消该设置需要到 `chrome://flags/` 中将 `SameSite by default cookies`、`Cookies without SameSite must be secure`、`Schemeful Same-Site` 这三项置为 `Disabled`.  

而 Apple 更绝，直接在 macOS 10.14 和 iOS 12 全面禁用了第三方 cookie，即使设置了 `samesite=none` 也是无效的。

使用 Chrome 89.0.4389.114 测试过程中发现，同个主域下的子域名无需设置 `samesite=none`  或者开启上述三项设置，都可以直接设置成功。如 `a.xwenliang.cn` 请求 `b.xwenliang.cn` 的接口，只需要像以前一样设置 [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#requests_with_credentials) 即可。

不同主域则需要设置 `samesite=none; secure;`，否则会提示需要有该设置：  
> This Set-Cookie didn't specify a "SameSite" attribute and was defaulted to "SameSite=Lax", and was blocked because it came from a cross-site response which was not the response to a top-level navigation. The Set-Cookie had to have been set with "SameSite=None" to enable cross-site usage.

既然 `samesite=none; secure;` 需要同时设置，那接口提供方只能是 https 的地址了，否则 `secure` 设置不生效。那如果是 https 的地址请求 http 的接口会怎样呢？直接报错啦：  
> Mixed Content: The page at 'https://devfuns.com/index.html' was loaded over HTTPS, but requested an insecure resource 'http://qdxinxi.com/'. This request has been blocked; the content must be served over HTTPS.