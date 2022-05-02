---
layout: post
title: 浅析 Session 和 Cookie
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2013-11-28 11:36:04+0800
orig_link: https://xwenliang.cn/p/5296ba24bb1eabe047000001
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


这两天在折腾这个博客的时候，遇到一些关于 session 和 cookie 的问题，回顾总结为此文。  

博客刚落成的时候，我用的 connect-mongo 来存储 session, 那时候还不知道 session 到底什么什么东西，只知道它可以保持会话状态。在做登录的时候，就有点发晕了，我只验证了用户名和密码，通过的话，就将 user 重新写入 req.session. 后来我打开 mongo, 运行 `db.sessions.find()` 之后傻眼了，一大片的 session, 里面存储的 user 信息大多都是重复的。  

也就是说每登录一次，都会产生一个 session 存入 mongo. 这还了得，肯定会影响 mongo 的性能啊。于是乎转用了 session 的 MemoryStore 来存储 session. 但是想了想，这样治标不治本啊，不管存到哪里，不是都要产生很多的垃圾吗？  

后来又发现了一个问题，浏览器打开的情况下，再打开其他标签，登录状态是有的，可是浏览器一旦全部关闭再打开，登录状态就没了。这是怎么回事？难道是因为存的 MemoryStore 吗？  

我又重新将 session 存入 mongodb, 发现同样的问题仍然存在。这时候我发现一个问题，浏览器的 cookie 中有一个我设定的 sid, Value是一串加密过的字符，过期时间是 `session`. 只要不关闭浏览器，这个名为 sid 的 Value 一直是个固定值。关闭浏览器再打开，这个 sid 就变了。 sid 变了，登录状态就没了。  

我才发觉，这个过期时间为 `session` 的意思，就是生命周期仅为浏览器不关闭的这段时间。可是我在使用 MemoryStore 的时候，明明设置了 session 的过期时间为 30 天后啊：  

```javascript
var sessionStore = new express.session.MemoryStore({
    reapInterval: 1000*60*60*24*30
});
```

为啥在关闭浏览器再打开的时候，sid 就变了呢？那这个「收割间隔」又是什么意思呢？不是 session 的生效时间吗？  

再后来我开始折腾这个 reapInterval, 把它设为 5 秒过时，当浏览器关闭 1 分钟后再打开，查询 MemoryStore, 发现这个 session 依然存在里面。这里我就不明白了，这个 reapInterval 到底是干啥用的呢？难道是 session 的生效保持时间？但是我登录后，只要浏览器不关闭，放在那放一天，这个 sid 也是不变的啊...难道是我使用这个库的方法不对吗？  

[相关问题](http://stackoverflow.com/questions/7549770/express-session-store-and-reapinterval)  

[Seperate Cookie and Session Expiration](https://github.com/senchalabs/connect/issues/328)  

最后，我自己重新做了自动登录功能，当用户登录后，我会手动存一个名为 ssid 的 cookie, 要存为 httpOnly, 防止 xss 攻击获取用户的 cookie, 里面存储了登录会话的 sessionID, 下次用户再进来的时候，我会拿这个 sessionID 去 MemoryStore 中查询，是否有记录登录的 session, 有的话就将会话还原，恢复用户登录状态。  

我觉得 session 是基于 cookie 的说法，原因在于 http 是无状态协议，所以尽管在后台存储了 session, 但依然需要客户端的一个唯一的标识来确定这个 session 的归属，所以只能将这个标识存入 cookie (现在浏览器选择很多，可以存本地存储等，但是客户端可以读取，为了安全，还是存为 httpOnly 的 cookie 吧)  

当用户再次进来的时候，就可以用这个标识来判断后台中是否已存储与之对应的 session. 那么这个 session 的过期时间可以通过设定客户端的 cookie 的过期时间来控制。  

