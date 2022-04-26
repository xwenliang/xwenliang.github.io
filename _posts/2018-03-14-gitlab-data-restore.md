---
layout: post
title: 腾讯云 centos7 安装 gitlab 及数据迁移
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2018-03-14 18:59:16+0800
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


前几天花 360 元撸了 4 年 1 核 2G 腾讯云，最近打算把原来阿里云上的 gitlab 迁过去，主要原因是这东西开起来就吃掉 1G 内存，当初为了能装这个玩意还升配了阿里云，花了不少银子。  

当初阿里云怎么装的 gitlab 都有点忘干净了，只记得这玩意好像内置了 nginx, 搞不好会和之前安装的 nginx 有冲突。这次重新装正好可以记录下过程。  

打开[ gitlab 官网](https://about.gitlab.com/installation/)，选择自己的 linux 版本，然后按照提示一步步的进行即可完成安装。安装完成后发现系统里还没装 nginx, 然后再装好 nginx, 装完后想着把 https 也一起搞好吧，就继续安装了 certbot, 关于 certbot 的安装可以参照我的[这篇文章](https://xwenliang.github.io/backend/2017/11/02/https-configure.html)  

以上搞定后，开始生成 https 证书：  

`./path/to/certbot-auto --nginx certonly -d default.com`  

发现有报错：  

> `Error while running nginx -c /etc/nginx/nginx.conf -t`  

知道可能是 certbot-auto 默认使用 `/etc/nginx/nginx.conf` 这个路径的 nginx 配置文件，可是我的配置文件并不在这个目录。执行 `./path/to/certbot-auto --help all` 发现可以通过 `--nginx-server-root` 来指定该配置文件的路径。  

执行 `.path/to/certbot-auto --nginx certonly -d default.com --nginx-server-root /path/to/nginx/conf/` 后又报错：

> `nginx restart failed:`  

看提示应该是刚装的 nginx 和 gitlab 内置的 nginx 端口冲突导致不能启动，所以我们先把 gitlab 停掉：`gitlab-ctl stop`  

然后再次执行上面的命令，发现还有报错：

> `Failed authorization procedure. default.com (http-01): urn:acme:error:unauthorized`  

查看报错的详细信息，发现脚本是真实请求了这个域名下的某个地址，由于域名是乱写的不能验证成功。所以我们先给 nginx 配置一个可以访问的域名，例如 mydomain.com, 然后再次执行 `.path/to/certbot-auto --nginx certonly -d mydomain.com --nginx-server-root /path/to/nginx/conf/`, 证书终于成功生成了。

nginx 配置证书及证书更新可以参考我之前提到的[这篇文章](https://xwenliang.github.io/backend/2017/11/02/https-configure.html)  

---

配置好 nginx 及 https 后，我们接下来要替换 gitlab 内置的 nginx 服务器，然后把原来阿里云上的数据导过来。  

替换内置 nginx 可以参考[官方文档](https://docs.gitlab.com/omnibus/settings/nginx.html#using-a-non-bundled-web-server)，这里有详细的说明，打开 `/etc/gitlab/gitlab.rb`：  

1. 先将里面的 `#nginx['enable'] = true` 改为 `nginx['enable'] = false`  
2. 然后设置 `web_server['external_users] = ['nginx']`  
3. 最后执行 `gitlab-ctl reconfigure`  

我们发现又报错了：  

> `STDERR: gpasswd: user 'nginx' does not exist`  

说好的 CentOS 的 nginx user 是 `nginx` 呢？我们执行 `ps aux | grep nginx` 后发现，nginx 的用户果然不是什么 `nginx` 而是 `nobody`. 再运行 `getent passwd` 来查看所有用户后发现，也不存在这个叫做 `nginx` 的用户，那我们创建一个好了: `adduser nginx`  

然后再打开 nginx.conf 将 nginx 的用户改为这个 `nginx`, 执行 `nginx -s reload` 然后发现 nginx 的用户果然变成了 `nginx`. 再执行 `gitlab-ctl reconfigure` 后发现，终于配置成功了。  

---

但却发现这 1 核 2G 的腾讯云好像有点带不动这个 gitlab, 启动后命令行输入内容有很大的延迟和卡顿，甚至有些操作直接 `Cannot allocate memory` 了。查看官网文档发现，这货的最低配置已经是 4GB 的 RAM 了，记得在阿里云(Ubuntu 12.04)装的时候还是 2GB 呢，查看了下当初装的是 `gitlab-ce@9.1.10`, 而现在在腾讯云装的是 `gitlab-ee@10.5.4`. 那么这俩货有什么区别呢？搜索到[这篇文章](http://www.infoq.com/cn/news/2016/02/gitlab-to-open-source-maintainer)后从中了解到，CE 是社区版完全免费，EE 是企业版有很多收费服务。因为要转移数据的阿里云装的是 CE, 为了减少麻烦，决定腾讯云也使用 CE.  

再次查看官方安装文档后发现，所有系统推荐的安装方式都变成了 EE, 无奈我们只好找到 CE 社区的 [package server](https://packages.gitlab.com/gitlab/gitlab-ce) 自己下载，然后安装：  

`curl -s https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.rpm.sh | sudo bash`  

执行 `yum list gitlab-ce` 后发现脚本更新的源已经是 `10.5.4` 了，还是为了减少麻烦，我们要找到之前装的 `9.1.10` 版本进行安装：  

```bash
wget --content-disposition https://packages.gitlab.com/gitlab/gitlab-ce/packages/el/6/gitlab-ce-9.1.10-ce.0.el6.x86_64.rpm/download.rpm
yum localinstall gitlab-ce-9.1.10-ce.0.el6.x86_64.rpm
```

安装完成后，修改配置文件，执行 `gitlab-ctl reconfigure` 然后 `gitlab-ctl start`, 终于启动成功了，并且还有几百的剩余 RAM, 完全感觉不到延迟和卡顿。剩下就是迁移数据了。  

参考[备份与恢复](https://docs.gitlab.com/ee/raketasks/backup_restore.html)：  

1. 先到阿里云执行 `gitlab-rake gitlab:backup:create`, 会在默认目录 `/var/opt/gitlab/backups` 下创建一个名称类似`1521022067_2018_03_14_gitlab_backup.tar`的文件  
2. 然后到腾讯云把该文件 scp 过来，也放到 `/var/opt/gitlab/backups` 目录下  
3. 由于先前做好的铺垫，两边环境基本一致，直接执行 `gitlab-rake gitlab:backup:restore BACKUP=1521022067_2018_03_14` 恢复备份，完成后打开网址，发现数据已经全部迁移过来了。  

---

使用 non-bundled-web-server 关键配置：  

```bash
# /etc/gitlab/gitlab.rb
external_url 'https://git.xwenliang.cn'
web_server['external_users'] = ['nginx']
nginx['enable'] = false
```

```bash
# /data1/server/nginx/conf/vhosts/git.xwenliang.cn.conf
upstream gitlab-workhorse {
    server unix:/var/opt/gitlab/gitlab-workhorse/socket;
}
server {
    listen 443 ssl;
    ssl_certificate xxx/fullchain.pem; # 证书地址
    ssl_certificate_key xxx/privkey.pem; # 证书key地址
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    server_name git.xwenliang.cn; 
    server_tokens off;
    root /opt/gitlab/embedded/service/gitlab-rails/public;
    access_log  /var/log/nginx/gitlab_access.log;
    error_log   /var/log/nginx/gitlab_error.log;
    location / {
        client_max_body_size 0;
        gzip off;
        proxy_read_timeout      300;
        proxy_connect_timeout   300;
        proxy_redirect          off;
        proxy_http_version 1.1;
        proxy_set_header    Host                $http_host;
        proxy_set_header    X-Real-IP           $remote_addr;
        proxy_set_header    X-Forwarded-For     $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto   $scheme;
        proxy_pass http://gitlab-workhorse;
    }
}
server{
    listen 80;
    server_name git.xwenliang.cn;
    return 301 https://git.xwenliang.cn$request_uri;
}
```

系统及软件版本：  

阿里云 1 核 2G Ubuntu 12.04.1  
腾讯云 1 核 2G CentOS 7.2.1511  
gitlab-ce-9.1.10-ce.0.el7.x86_64  

