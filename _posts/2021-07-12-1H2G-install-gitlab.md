---
layout: post
title: 1 核 2G 服务器安装 gitlab-ce
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2021-07-12 01:21:01+0800
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


3 年前花了 360 元买的 1 核 2G 企鹅云要到期了，上面跑着我的 gitlab, 看了下续费一年的价格达到了惊人的 1135.44 元，为了防止被割韭菜，打算把该服务直接迁到目前用了 7 年多的当前博客部署的某动物园云，配置同样也是 1 核 2G 内存。

看官方安装介绍，1 核 4G 已经是能运行的最低配置，那我原来的机器是怎么运行的呢？查看原来安装版本发现是 gitlab-ce_9.1.10, 而目前的最新版已经到了 gitlab-ce_14.0.5, 或许我们装个复古版还是可以继续运行呢？所以我花了 34.91 元买了 1 星期某动物园云 1 核 4G 配置的机器，打算尝试一番。

---  

查看发行历史，发现官方提供的[下载列表](https://packages.gitlab.com/gitlab/gitlab-ce)中最早是发布于 6 年前的 [gitlab-ce_7.10.0](https://packages.gitlab.com/gitlab/gitlab-ce/packages/ubuntu/precise/gitlab-ce_7.10.0~omnibus-1_amd64.deb), 然后找到 7 系列的最后一个版本 gitlab-ce_7.14.3 一起下载了下来，开始尝试安装这两个版本，如果内存占用差不多的话那肯定选择后者，经过了中间的迭代应该是修复了不少问题。两个版本安装后的截图如下：  
![](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-4-6-6d6680abd4.jpg)  
![](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-4-6-e19d76529a.jpg)  

可以看到内存占用是差不多的，并且新版本的 logo 也相较之前发生了改变，整体的布局也更顺眼一些，所以 gitlab-ce_7.14.3 应该是我的目标版本。

通过 `gitlab-ctl status` 查看，启动的服务也是相同的，分别是以下 6 个：  
`logrotate`  
`nginx`  
`postgresql`  
`redis`  
`sidekiq`  
`unicorn`  

查看动物园云后台显示的机器负载情况，也是差不多的：cpu 1.33% 内存 31%  

---  

为了防止数据不能迁移，我还下载了同版本的 gitlab-ce_9.1.10, 安装后发现相比于 7 系列， 9 系列占用内存已经大幅提升，同时多出了 7 个服务(+)，分别是：  
`logrotate`  
`nginx`  
`postgresql`  
`redis`  
`sidekiq`  
`unicorn`  
`gitaly`(+)  
`gitlab-monitor`(+)  
`gitlab-workhorse`(+)  
`node-exporter`(+)  
`postgres-exporter`(+)  
`redis-exporter`(+)  
`prometheus`(+)  

查看动物园后台显示的机器负载情况，已经达到了：cpu 4.34% 内存 57%  
并且这个版本已经内置了机器的负载监控，显示内存占用 1.51 GB  

9 系列有个比较好的改进是对初始账号的设置，如果是首次进入(从未有任何账户创建及登录), 会直接给出设置初始账号 root 的密码的页面，免去了 7 系列需要进入 `gitlab-rails console` 修改初始密码的尴尬操作。我们以后在设计类似系统的时候也可以采用此方案。

界面截图：  
![](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-4-6-93d1f7b50b.jpg)  

---

我们再来简单看看最新的 gitlab-ce_14.0.5 都有哪些变化  

安装后先查看启动的服务情况，发现比 9 系列还要多出 3 个服务(++)，分别是：  
`logrotate`  
`nginx`  
`postgresql`  
`redis`  
`sidekiq`  
`unicorn`  
`gitaly`(+)  
`gitlab-monitor`(+)(-)  
`gitlab-workhorse`(+)  
`node-exporter`(+)  
`postgres-exporter`(+)  
`redis-exporter`(+)  
`prometheus`(+)  
`alertmanager`(++)  
`grafana`(++)  
`puma`(++)  

然后查看动物园后台显示的机器负载情况，达到了：cpu 14.77% 内存 88.32%  
内置的机器负载监控，显示内存占用 3.06 GB，多么可怕...  

界面截图：  
![](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-4-6-a145a4c788.jpg)  

---  

各版本对比： 

| version | cpu | mem | service |
| --- | --- | --- | --- |
| 7.14.3 | 1.33% | 31% | 6 |
| 9.1.10 | 4.34% | 57%(1.51G) | 13 |
| 14.0.5 | 14.77% | 88.32%(3.06G) | 15 |


所以最后果断选择了 [gitlab-ce_7.14.3](https://packages.gitlab.com/gitlab/gitlab-ce/packages/ubuntu/precise/gitlab-ce_7.14.3-ce.1_amd64.deb)  

以上都是在：只有 1 个 root 用户，且只创建一个只包含 readme 文件的仓库 条件下得出的单次测试结果，仅供参考。

这里是 [release notes](https://about.gitlab.com/releases/categories/releases/), 有兴趣的同学可以对比看看各个大版本都做了什么事情。  

