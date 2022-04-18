---
layout: post
title: 微信封禁链接小结
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2019-10-25 20:53:52+0800
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


大概在今年 `6·18` 的前几天，我们发现分享至好友和朋友圈的营销活动链接被频繁封禁：  

![IMAGE]](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-19-9879980e7b.jpg)  

经过大量被封禁链接的规律分析发现，目前微信封禁的是初次访问的 url 中的 path 部分，改变 path 即可临时解封。（如果页面有二次跳转，那么微信封禁的会是跳转前的 url 地址）  

但改变 path 成本很高，需要服务端有对应的内容与之响应，通常的手段要么是 nginx 配置虚拟路径，要么是前端复制入口文件，多入口上线，但这不能从根本解决问题，需要很高的人工成本。

所以我们采用了 nginx 对入口做递归 try_files 的方式，无需研发做任何改动即可实现 path 的改变，这样我们在分享的时候随机设置该 path, 即可实现规避微信目前的封禁策略：  

```nginx
location ~ .*\.[^\/]+$ {
    root /export/App/;
}
location ~ {
    root /export/App/;
    try_files $uri $uri/index.html @rewrite;
}
location @rewrite {
    rewrite ^(.*)/.+ $1/ last;
}
```

这样可以实现：  

活动正常访问地址是 `https://xwenliang.cn/a/b/` (`/export/App/a/b`目录下有`index.html`)  

添加上述该规则后，访问 `https://xwenliang.cn/a/b/xxx/` (xxx可以是非`/`的任意内容) 都可以正常返回 `/export/App/a/b/index.html` 的内容，即实现了随机路径访问  

---

但是需要注意以下几点：  
1. 其他静态资源 (js/css/image) 引用地址要用**绝对路径**，防止由于入口多加一级路径会导致**相对路径**改变的问题  
2. 单页面应用要注意路由匹配要做**模糊匹配**  
3. 务必评估 try_files 和 rewrite 带来的额外性能开销，不建议对所有资源做 try_files 和 rewrite, 带后缀的文件访问地址(如 `https://xwenliang.cn/a.html` )应该真实存在于物理路径上，这样方便于日后维护与问题排查，如果有 `https://xwenliang.cn/a.html`、`https://xwenliang.cn/b.html` 这种路径的访问需求，建议将 a.html 和 b.html 放置于a、b目录下，并重命名为 index.html, 然后其访问路径为 `https://xwenliang.cn/a/`、`https://xwenliang.cn/b/`，则可以在其后加任意随机路径  
4. `rewrite last` 的最大深度默认为10层，超过会报500  

这几天微信又更新了新的[微信外部链接内容管理规范](https://weixin.qq.com/cgi-bin/readtemplate?t=weixin_external_links_content_management_specification)，不知道会不会对上述规避方式做定向打击。  

