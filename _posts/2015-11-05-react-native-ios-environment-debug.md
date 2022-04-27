---
layout: post
title: React Native iOS 环境部署时遇到的坑
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-11-05 18:55:52+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


这是自己之前遇到过的一个坑，今天又有同事遇到了，想记录下自己当时解决这个问题的思路和过程。安装完 react-native-cli, 初始化项目，运行后却遇到如下报错：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-28-cacc1607ae.jpg)  

既然有报错，那就去看看报错的这几行代码到底干了啥，按照提示的路径找到这个文件：  

```javascript
const nodeCrawl = require('./node');
const watchmanCrawl = require('./watchman');

function crawl(roots, options) {
  const {fileWatcher} = options;
  return fileWatcher.isWatchman().then(isWatchman => {
    if (!isWatchman) {
      return false;
    }

    // Make sure we're dealing with a version of watchman
    // that's using `watch-project`
    // TODO(amasad): properly expose (and document) used sane internals.
    return fileWatcher.getWatchers().then(([watcher]) => !!watcher.watchProjectInfo.root);
  }).then(isWatchman => {
    if (isWatchman) {
      return watchmanCrawl(roots, options);
    }

    return nodeCrawl(roots, options);
  });
}
```

发现是 watchman 这个模块导致的报错，watchman 是我们用来监听文件修改用的，肯定是调用了通过 brew 安装的 watchman 服务。但是依然束手无策啊，通常遇到此类问题，只能藉希望于更新这个服务会解决问题。  

然后 `brew update`, 漫长的等待后，更新列表里果然出现了 watchman, 然后 `brew upgrade watchman`, 更新完成后再运行，发相项目果然已经可以正常运行了。  

通常遇到此类比较新的技术问题，又是英文报错，某度上基本搜不到什么结果，如果可以翻墙的话，去 google 基本都可以找到答案，后来我发现比较新的技术问题，google 搜出来的结果基本都指向了这个服务代码的 github 仓库的 issue, 所以有空多去 github 转转是很有收获的，即使没找到答案也可以现场提问啊 :)  

比如上面这个问题，在 ReactNative 的官方 github 上就有[答案](https://github.com/facebook/react-native/issues/3703)  

react-native-cli: `0.1.4`  
react-native: `0.12.0`  
watchman: `3.1.0`  

更新后 watchman: `3.9.0`  

