---
layout: post
title: 开启 https 小记
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2017-11-02 19:39:13+0800
sync_link: https://xwenliang.cn/p/59fb03e1fc6a14914c000001
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


每次用微信打开我的博客页面，总能看到运营商那个恶心的注入广告，所以近期打算折腾下用上 https. 开始折腾新东西的时候，总是有种不知从哪里下手的感觉，那就先上某乎看看有哪些免费证书吧。  

呼声比较高的是 [Let's Encrypt](https://letsencrypt.org/), 不但完全免费，甚至提供了非常好用的配置工具 [certbot](https://certbot.eff.org/)  

进入 [certbot](https://certbot.eff.org/) 官网选择 web 服务器和系统版本后，会给出详细的安装配置文档：  

获取安装脚本：  

```bash
wget https://dl.eff.org/certbot-auto
chmod a+x certbot-auto
```

执行脚本安装证书：  

```bash
# 创建证书并自动配置nginx
sudo ./path/to/certbot-auto --nginx
# 仅创建证书
sudo ./path/to/certbot-auto --nginx certonly
```

执行上述脚本后，会自动搜寻 nginx 的 vhosts, 提示你选择要配置的域名，配置完成后重启 nginx 就可以通过 https 来访问网站了。唯一的问题是证书只有 90 天有效期，但是 certbot 也提供了完美的更新方案：  

```bash
sudo ./path/to/certbot-auto renew --dry-run
```

上述命令会模拟更新证书服务，提示成功的话新建 crontab 定时更新服务就可以了，官方建议一天更新两次：  

```bash
0 */12 * * * ./path/to/certbot-auto renew --renew-hook "./path/to/nginx -s reload"
```

这样当证书更新后就会自动重启 nginx 使新的证书生效。  

