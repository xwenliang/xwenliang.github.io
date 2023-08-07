---
layout: post
title: 升级用了快十年的阿里云 ECS
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2023-08-08 00:53:13+0800
sync_link: https://xwenliang.cn/p/64d11497175481ac5bd0e2bc
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


因为一直装不上 node@14, 又急于使用 [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining), 终于在去年年底忍无可忍做了系统升级，整个过程都记录了下来，主要包括以下内容：  

- 开机启动项配置变更  

- mongodb 跨大版本升级及数据恢复  

- certbot 变更  

- gitlab 遇到 gem 包升级问题  

- mysql 安装老版本及数据恢复  

- php 安装老版本(为了兼容老代码)  

- phpMyAdmin 安装老版本及数据恢复  

- 阿里云升级/更换系统后恢复数据  


以下为详细内容：  

### 实例升级 2014-03-12(ecs.s1.small) -> 2022-10-30(ecs.n4.small)(¥263.64)  

### Ubuntu12.04 -> Ubuntu22.04  

### 升级原因：安装 node@14 报错：  

`node: /lib/x86_64-linux-gnu/libc.so.6: version 'GLIBC_2.16' not found (required by node)`  
`node: /lib/x86_64-linux-gnu/libc.so.6: version 'GLIBC_2.17' not found (required by node)`  

ubuntu12.04 只支持到 GLIBC_2.15

### 开机启动项目变更  

ubuntu12.04 /etc/rc.local  
ubuntu22.04 systemctl enable xxx  

service/init.d(SysVInit) 和 systemctl(SystemD)  

1. 后者是前者的升级版，将会取代前者  

2. 部分老的软件因为 legacy 的原因会继续支持前者，但许多新的软件已经不再支持  

> https://askubuntu.com/questions/911525/difference-between-systemctl-init-d-and-service  
> https://www.tecmint.com/systemd-replaces-init-in-linux/  

`systemctl status xxx`  

- /etc/systemd/system         - Local configuration

- /run/systemd/system         - Runtime units

- [/usr]/lib/systemd/system   - Units of installed packages

优先级从高到低  

`systemctl list-unit-file`    - 列出所有的 service  
`journalctl -u mongod -e`     - 从尾部开始查看 mongod 服务的日志  
`systemctl daemon-reload`     - 清除已经删掉的 service  

### 手动恢复内容  

#### 目录同步(打包后传送，否则软链接有问题):  
    - /root 网站主要内容  
    - /etc/letsencrypt 证书  

#### nginx:  
`apt install nginx`  

#### mongodb:  
`apt install gnupg`  
`wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -`  
`wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_amd64.deb`  
`dpkg -i libssl1.1_1.1.1f-1ubuntu2_amd64.deb`  
`apt install mongodb-org`  

安装的是 v6.0.2 版本，mongo 命令替换成了 mongosh, 而且老的数据库不能识别(v2.6.1)  

需要恢复到老的版本：  
`wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.6.1.tgz`  

解压即可  
**但是 node mongodb@4 的驱动需要的 mongodb 版本大于 3.6**  
**而要将 2.6.1 的数据库升级到 3.6 需要先升级到 3.4...**  

> https://stackoverflow.com/questions/48318487/error-while-upgrading-mongodb-from-3-2-to-3-6  
> https://www.mongodb.com/docs/manual/release-notes/3.6-upgrade-standalone/  

所以保留了 2.6.1 的 mongodb, 使用 startMongod2.6 启动，端口改为 26017  
最终升级到了 3.6 版本，并注册了开机启动服务  
/usr/lib/systemd/system/mongod.service  

#### certbot:  
`snap install certbot --classic`  

#### gitlab:  
`dpkg -i gitlab-ce_xxx.deb`  

同步配置目录：/etc/gitlab  
同步服务目录：/opt/gitlab  
同步数据目录：/var/opt/gitlab  
需要关掉服务再打包同步，否则数据库会出问题  
然后登录时报500，找到这么个答案：  
> https://stackoverflow.com/questions/50213071/why-does-bcrypt-no-longer-accept-hashes  

尝试修改：  
`vim /opt/gitlab/embedded/service/gem/ruby/2.1.0/gems/bcrypt-3.1.7/lib/bcrypt/engine.rb`  
`gitlab-ctl restart`  

成功(你 gem 包升级也有不讲武德的作者啊...)  

#### mysql:  
老数据库版本为 5.1.73  
尝试安装 5.7  
apt policy mysql-server 查看可安装的版本，发现只有 8.x.x  
尝试增加 apt repository 但 apt-key 一直校验不过，新的只包含 8.x.x, 老的校验不过...  
所以决定手动编译安装  

`wget https://downloads.mysql.com/archives/get/p/23/file/mysql-server_5.7.31-1ubuntu18.04_amd64.deb-bundle.tar`  
`dpkg -i mysql-common_5.7.31-1ubuntu18.04_amd64.deb`  
`dpkg -i mysql-community-client_5.7.31-1ubuntu18.04_amd64.deb`  
`dpkg -i mysql-client_5.7.31-1ubuntu18.04_amd64.deb`  
`apt install libmecab2`  
`dpkg -i mysql-community-server_5.7.31-1ubuntu18.04_amd64.deb`  
`dpkg -i mysql-server_5.7.31-1ubuntu18.04_amd64.deb`  

**装完后发现老的数据库文件用不了，想升级得先从 5.1 升到 5.5, 再从 5.5 升到 5.6, 再从 5.6 升到 5.7**  

所以打算直接安装 5.1.73  
所有版本：https://downloads.mysql.com/archives/community/  
`wget https://downloads.mysql.com/archives/get/p/23/file/MySQL-5.1.73-1.glibc23.x86_64.rpm-bundle.tar`

解压后全是 rpm 文件，想要安装建议先转 deb:  
`alien MySQL-server-5.1.73-1.glibc23.x86_64.rpm`  
`alien MySQL-client-5.1.73-1.glibc23.x86_64.rpm`  
`dpkg -i mysql-server_5.1.73-2_amd64.deb`  
`dpkg -i mysql-client_5.1.73-2_amd64.deb`  

将 /etc/init.d/mysql 重命名为 /etc/init.d/mysqld 并同步老的配置  
执行 /etc/init.d/mysqld start 报错：Manager of pid-file quit without updating file.  
发现是 mysql_safe 不能启动导致：chown: invalid user: 'mysql'  
创建 mysql 组及 mysql 用户，将老的数据库目录变更为该用户：  
`groupadd mysql`  
`useradd mysql -g mysql`  
`chown -R mysql:mysql xxx`  

再执行 /etc/init.d/mysqld start 成功  

添加 /lib/systemd/system/mysqld.service 后执行 systemctl start mysqld 后一直在循环重启  
不需要开机启动，所以暂时把该文件删除了  

执行 `mysql -u root -p` 报错：  

> mysql: error while loading shared libraries: libncursesw.so.5: cannot open shared object file: No such file or directory  

执行 `ldd /usr/bin/mysql` 查看依赖库：  

> libncursesw.so.5 => not found  

直接链到 libncursesw.so.6:  
`ln -s /lib/x86_64-linux-gnu/libncursesw.so.6 /lib/x86_64-linux-gnu/libncursesw.so.5`  

执行 `mysql -u root -p` 仍报错：  

> ERROR 2002 (HY000): Can't connect to local MySQL server through socket '/var/lib/mysql/mysql.sock' (2)  

发现是没有指定连接的地址：  
`mysql -u root -p -S /var/lib/mysql/mysql.sock`  

成功  

或者 `ln -s /tmp/mysql.sock /var/lib/mysql/mysql.sock`  
可以在 /etc/my.cnf 文件中修改该地址  


#### 安装 php5.6  
> https://www.tecmint.com/install-different-php-versions-in-ubuntu/  

`add-apt-repository ppa:ondrej/php`  
`apt policy php5.6`  
`apt install php5.6`  
`apt install php5.6-fpm`  

禁止开机启动  
`systemctl disable php5.6-fpm.service`  
`systemctl disable phpsessionclean.timer`  

手动启动  
`systemctl start php5.6-fpm.service`  

修改 nginx 配置:  

```nginx
# fastcgi_pass 127.0.0.1:9000;
fastcgi_pass unix:/run/php/php5.6-fpm.sock;
```

问题：  
不知道哪个环节多装了个 apache2 也用 80 端口，跟 nginx 冲突，并且默认开机启动，所以关掉：  
`systemctl stop apache2`  
`systemctl disable apache2`  


#### 安装 phpMyAdmin  
所有版本：  
> https://www.phpmyadmin.net/files/  

报错：  
> The mbstring extension is missing. Please check your PHP configuration.  

`apt install php5.6-mbstring`  

报错：  
> 缺少 mysqli 扩展。请检查 PHP 配置。 See our documentation for more information.  

`apt install php5.6-mysql`  

成功  

数据库连不上，通过 phpinfo(); 可以看到所有的配置项，配置文件地址：/etc/php/5.6/fpm/php.ini  
由于原来的 php 版本是 5.4.23, 打开后出现了很多的 Deprecated 报警，可以通过 error_reporting 关闭  
各种配置都不好使，配置了 default_socket=/tmp/mysql.sock 后其他几个能打开了，但是它就是不好使  
选择寻找 nodejs 版本的软件: https://github.com/nodeadmin/nodeadmin  
安装后功能过于简单，且已经许久没有维护，所以选择继续折腾 phpMyAdmin  
将老的镜像还原到测试机上发现它是通过 mysqli 这个扩展来连接的，而我们的其他几个都是通过 mysql  
将 mysqli 的 default_socket 也设置为 /tmp/mysql.sock 后成功  


### 阿里云升级/更换系统后恢复数据  

例如实例 A 位于华东 1 可用区 B, 操作系统为 CentOS 6.5 此时需要更换操作系统为 CentOS 7.9, 您可通过以下步骤进行数据备份和恢复:  

说明：建议创建快照以及使用快照创建云盘的功能来实现。  

1. 为实例 A 当前系统盘创建快照。具体操作方法，请参见创建普通快照。  

2. 在控制台打开购买云盘页面，购买和服务器在相同可用区的云盘，选择从快照创建磁盘。具体操作方法，请参见使用快照创建云盘。  

3. 操作更换系统盘，选择 CentOS 7.9. 具体操作方法，请参见更换系统盘（公共镜像） 。  

4. 将之前创建的数据盘，挂载到更换系统盘后的实例上。如果是 Linux 实例，您需要登录实例执行 mount 操作。详细步骤，请参见挂载数据盘。  


![aliyun]({{ site.gallery_prefix }}2023-08-07-6ff944bea7.jpg)  

