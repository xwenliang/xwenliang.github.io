---
layout: post
title: package-lock 和 npm-shrinkwrap
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2019-04-28 21:54:14+0800
sync_link: https://xwenliang.cn/p/5cbd98b57eb9de0c54000003
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最近半年都在做一个团队内部的构建工具(以下简称CLI)，目的是统一管理构建环境的版本，构建环境出了问题或者需要升级的时候统一解决。  

既然是想统一版本，那肯定希望每个人安装到本地的CLI所依赖的`node_modules`版本都是一致的，我们用的node版本是`v8.12.0(npm@6.4.1)`，正好会自动生成`package-lock.json`(从npm@5.0.0开始)，想当然的以为它的存在会锁定每个人安装的CLI所依赖的`node_modules`版本。但是经过实践发现，其他人安装到本地的CLI中并不存在此`package-lock.json`文件，所以他们的`node_modules`中安装的第三方依赖还是遵循了`package.json`中的模糊版本规则，导致这些依赖的版本可能与我本地开发时所安装的依赖版本并不一致。  

那`package-lock.json`是干嘛用的呢？我们又该如何锁定第三方依赖版本呢？npm官方的回答是[这样](https://github.com/npm/cli/blob/latest/doc/spec/package-lock.md)的：  

> - package-lock.json, which is ordinarily always present and is never published.  
> - npm-shrinkwrap.json, which is created with npm shrinkwrap and usually published.  

也就是说`package-lock.json`并不会随着`npm publish`而发布到npm仓库，想要发布到npm仓库应该使用`npm-shrinkwrap.json`，并且他俩格式完全一样，只是名字不一样而已。还有个兼容性的区别：前者只兼容`v8.0.0(npm@5.0.0)`及以上(发布时间2017-05-30)，后者兼容到`v0.11.14(npm@2.0.0)`及以上(发布时间2014-08-19)。  

所以我们应该使用`npm-shrinkwrap.json`来锁定CLI的依赖版本，经过测试发现确实可以锁定了，但是又出现了新的问题：我们的`npm-shrinkwrap.json`文件，在删除项目中的`node_modules`又重新执行`npm install`后产生了几千行变化，所有的`requires`字段中的固定版本都变成了模糊版本：  

```javascript
// 重新执行 npm install 前
{
    "name": "joyer-cli",
    "version": "1.1.6-rc.3",
    "lockfileVersion": 1,
    "requires": true,
    "dependencies": {
        ...,
        // 以@babel/generator为例
        "@babel/generator": {
            "version": "7.3.0",
            "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.3.0.tgz",
            "integrity": "sha512-dZTwMvTgWfhmibq4V9X+LMf6Bgl7zAodRn9PvcPdhlzFMbvUutx74dbEv7Atz3ToeEpevYEJtAwfxq/bDCzHWg==",
            "requires": {
                "@babel/types": "7.3.0",
                "jsesc": "2.5.1",
                "lodash": "4.17.10",
                "source-map": "0.5.0",
                "trim-right": "1.0.1"
            }
        },
        ...
    }
}
```

```javascript
// 重新执行 npm install 后
{
    "name": "joyer-cli",
    "version": "1.1.6-rc.3",
    "lockfileVersion": 1,
    "requires": true,
    "dependencies": {
        ...,
        // 以@babel/generator为例
        "@babel/generator": {
            "version": "7.3.0",
            "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.3.0.tgz",
            "integrity": "sha512-dZTwMvTgWfhmibq4V9X+LMf6Bgl7zAodRn9PvcPdhlzFMbvUutx74dbEv7Atz3ToeEpevYEJtAwfxq/bDCzHWg==",
            "requires": {
                "@babel/types": "^7.3.0",
                "jsesc": "^2.5.1",
                "lodash": "^4.17.10",
                "source-map": "^0.5.0",
                "trim-right": "^1.0.1"
            }
        },
        ...
    }
}
```

瞬间懵逼，为什么会产生这么大的变化呢，翻遍了[npm官方release notes](https://github.com/npm/npm/releases)终于在`v6.0.0`的`v6.0.0-next.0`的release notes下找到了这么一个`NEW FEATURE`:  

> `fe867aaf1` `49d18b4d8` `ff6b31f77` `78eab3cda` The requires field in your lock-file will be upgraded to use ranges from versions on your first use of npm. (@iarna)  

至于为什么要这样却没有找到任何信息。然后在本地做测试，发现使用`v8.11.4(npm@5.6.0)`执行`npm install`后就会产生固定版本的`requires`，而使用`v8.12.0(npm@6.4.1)`执行`npm install`后就会产生模糊版本的`requires`。我也是倒霉的可以，本地正好同时安装了这两个版本，应该是在版本切换以后执行了`npm install`而产生了`npm-shrinkwrap.json`的变化。  

那么既然它会发生变化，我们的lock还有什么意义呢？翻遍了npm的官方论坛后找到官方开发者自问自答的这么[一个帖子](https://npm.community/t/npm-i-changed-my-npm-shrinkwrap-package-lock-why/190)，在某些情景下它确实会发生变化：  

1. lock文件中有一些被声明无效的版本(可以通过`npm ls`来查看)，在修复它的同时会更改lock文件  
2. lock文件被改写，用以支持更多的特性  

我们上面的场景应该就是命中了2，被(无意义)的改写了。那如果我们就是不想更改lock文件呢？官方开发者 iarna 推荐了npm@6的新命令`npm ci`，如果发生了上面的需要修改lock文件的场景，`npm ci`将不会执行。也就是说它的执行不会对lock文件做任何更改。  

关于`npm ci`的更多知识可以看看官方的这篇[安利文章](https://blog.npmjs.org/post/171556855892/introducing-npm-ci-for-faster-more-reliable)，总结一下就是：  

1. `npm ci`非常快，快到耗时只有yarn的一半([可能有失公正](https://github.com/appleboy/npm-vs-yarn))  
2. `npm ci`不会对lock文件产生任何更改  
3. `npm ci`会先删除node_modules再安装  
4. `npm ci`不能单独安装某个package(比如 `npm ci xxx`会忽略参数，相当于`npm ci`)  

