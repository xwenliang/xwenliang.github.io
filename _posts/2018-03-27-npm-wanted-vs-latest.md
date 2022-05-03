---
layout: post
title: npm Wanted vs Latest
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2018-03-27 12:07:38+0800
sync_link: https://xwenliang.cn/p/5ab9c38a46dc6a1506000002
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


今天在使用 `vue-cli` 的时候报了更新提示，于是直接 `npm update vue-cli -g`, 发现并没有任何作用，使用更暴力的 `npm update vue-cli -g --force` 依然没有作用。看了官方提示后执行了 `npm update vue-cli -dd` 来显示更新过程中的细节，发现有这么一句：  

> **outdated** not updating vue-cli because it's currently at the maximum version that matches its specified semver range  

说不更新是因为已经处于**指定的版本区间**的最高版本了，一脸懵逼的想我在哪里指定了这个版本区间呢？先看看这货最新版本到底是啥吧：`npm view vue-cli`, 发现当前安装的版本后面确实还有一个版本，但这个版本区间到底在哪里指定的呢？  

执行 `npm outdated -g` 之后，发现有以下几种情况：  
1. 当前安装的版本`Current` = `Wanted` < `Latest`，这种状态即使强制更新也只会更新到`Wanted`这个所谓的**指定的版本区间**  
2. 当前安装的版本`Current` < `Wanted` = `Latest`，这种状态是可以正常更新的  
3. 当前安装的版本`Current` > `Wanted` = `Latest`，这种状态可以说是很神奇了  

再次查阅[文档](https://docs.npmjs.com/cli/outdated)发现这个 `Wanted` 指的是在 `package.json` 中的指定版本，而没有写入 `package.json` 的库和全局安装的库指的就是当前安装的版本：  

> wanted is the maximum version of the package that satisfies the semver range specified in package.json. If there's no available semver range (i.e. you're running npm outdated --global, or the package isn't included in package.json), then wanted shows the currently-installed version.  

这个说法准确吗，我们来测试一下：  
1. 先发布一个名叫 `semvernewtest` 的库(原谅我🤣)，发布版本为 `1.0.0`  
2. 然后在本地把这个库装到全局
3. 再将刚刚发布的 `semvernewtest` 更新至 `1.0.1`  
4. 执行 `npm outdated -g` 发现符合官方描述 `Current` = `Wanted` < `Latest`  
5. 很猥琐的将 `semvernewtest` 更新至 `0.0.1`  
6. 执行 `npm outdated -g` 发现变成了 `Current(1.0.0)` > `Wanted(0.0.1)` = `Latest(0.0.1)`  

也就是说，官方的这个描述并不那么可靠，关于这个 outdated 的问题很多人提了 issue:  
[issue10687](https://github.com/npm/npm/issues/10687)  
[issue9790](https://github.com/npm/npm/issues/9790)  
[issue19888](https://github.com/npm/npm/issues/19888)  
[stackoverflow](https://stackoverflow.com/questions/32689865/npm-wanted-vs-latest#)  

既然这个全局库不能直接 update, 就只能通过指定版本安装的方式来强制更新了，比如：  

`Current(1.0.0)` = `Wanted(1.0.0)` < `Latest(1.1.1)`  

我们只能`npm install xxx@1.1.1 -g`了  

