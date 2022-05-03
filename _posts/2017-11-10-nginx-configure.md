---
layout: post
title: nginx 配置小结
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2017-11-10 17:28:48+0800
sync_link: https://xwenliang.cn/p/5a05715014c84b094f000001
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


刚开始配置多个 server 的时候，发现一个奇怪的现象，比如有两个域名 a.com 和 b.com, 将监听 a.com 的 server 注释掉，居然还能访问到 a.com, 并且是 b.com 的内容  

到 nginx 官方查阅文档才了解到 default server 的概念，如果请求头中的 host 没有匹配到任何的 server name, nginx 就会将这个请求发送到这个端口的 default server上，这个 default server 默认是配置文件中的第一个 server, 也可以通过以下方式来指定：  

```bash
server {
    listen 80 default_server;
    server_name  example.com www.example.com
}
# 0.8.21前：listen 80 default;
```

这也就解释清楚了我遇到的那个「奇怪的现象」，但是怎么才能阻止这个现象的发生呢，官网也给出了解决方案：  

```bash
server {
    listen 80 default_server;
    server_name "";
    return 444;
}
```

这样所有流经 80 端口的请求，未匹配到 server_name 的都会跑到这里，被返回一个 444 的状态码并关闭。  

后来启用 https 后，想把 https 使用的 443 端口也加上这个默认配置：  

```bash
server {
    listen 443 ssl default_server;
    server_name "";
    return 444;
}
```

发现并不起作用，原因是没有配置 ssl_certificate 和 ssl_certificate_key:  

```bash
server {
    listen 443 ssl default_server;
    server_name "";
    ssl_certificate /position/of/ssl_certificate;
    ssl_certificate_key /position/of/ssl_certificate_key;
    return 444;
}
```

然后看了看 certbot 自动配置的 https 监听，发现用了这种手段来实现 http 转 https:  

```bash
if ($scheme != "https") {
    return 301 https://$host$request_uri;
} # managed by Certbot
```

这么做怕是每一个请求都需要经过这个判断吧，于是果断自己改成了:  

```bash
server {
    listen 80;
    server_name xwenliang.cn;
    return 301 https://xwenliang.cn$request_uri;
}
```

