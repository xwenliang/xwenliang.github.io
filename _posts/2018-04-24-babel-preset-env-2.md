---
layout: post
title: 迟迟未到的 babel-preset-env@2
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2018-04-24 18:20:34+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


从 `babel-preset-env` 之前官方 github 的 [release 列表](https://github.com/babel/babel-preset-env/releases?after=v2.0.0-alpha.15)中可以看到，距离可追溯的第一个 2.0 的 alpha 版本 `v2.0.0-alpha.4 (2017-04-07)` 已经过去了 382 天，在经历了几十个 alpha 版本和几个 beta 版本后版本号变成了 `7.0.0-beta.3`, 与之对应的 `babel-core` 也接连发布了多个 `7.0.0` 的 alpha 和 beta 版本，目前也已经到了 `7.0.0-beta.3`. 猜测接下来应该会和 `babel@7` 一起发布吧  

而我们在 `webpack` 中使用的 [babel-loader](https://github.com/babel/babel-loader) 也发布了 `babel-loader@^8.0.0-beta.x` 来使用最新的 `babel-preset-env@7.x` 和 `babel-core@7.x`. 等这些真正发布了我们就可以实现只配置 `.babelrc` 中的 `targets` 来实现**针对特定浏览器**的高级语法的翻译和 `native methods` 的 `polyfill` 了  

我们先来试试这些将要正式发布的 beta 版本，几个关键的配置：  

package.json  
```json
"devDependencies": {
    "@babel/core": "^7.0.0-beta.42",
    "@babel/preset-env": "^7.0.0-beta.42",
    "babel-loader": "^8.0.0-beta.2",
    "babel-polyfill": "^6.26.0",
    "webpack": "^2.7.0",
    "webpack-dev-server": "^2.11.2"
}
```

.babelrc
```json
{
    "presets": [
        [
            "@babel/preset-env", 
            {
                targets: {
                    "browsers": ["safari >= 7", "ie >= 9"],
                    "node": "6.10"
                },
                useBuiltIns: "usage"
            }
        ]
    ]
}
```

以上配置就会将代码翻译成支持 `safari >= 7`、`ie >= 9`、`node > 6.10` 这些环境的代码，并且不是全量的翻译，而是根据实际代码中有没有使用到需要翻译和 `polyfill` 的代码，也就是说不会产生冗余代码，请看[完整示例](https://github.com/xwenliang/xwenliang.github.io/tree/master/repro/test-babel-preset-env)  

在测试代码中我们使用了 `IE9` 所不支持的 `String.prototype.includes`, 由于在 `.babelrc` 中指定了需要支持到 `IE9`, 所以我们可以看到翻译后的代码自动加入了[对该 API 的支持](https://github.com/xwenliang/xwenliang.github.io/tree/master/repro/test-babel-preset-env/target/main.js#L1311-L1316)，而并没有加入对其他未用到的 `API` 的支持，如 `String.prototype.padStart`  

细心的同学可能会发现，`babel-core` 和 `babel-polyfill` 好像并没有使用到，但是他们确实是需要安装的，因为 `babel-preset-env` 只是检测了需要支持的环境以及翻译的配置(最新版本应该也执行了部分翻译，还没仔细看)，真正执行翻译代码的是 `babel-core`, 而 `babel-polyfill` 则是提供了 `native methods` 的 `polyfill` 部分的代码，如 `String.prototype.padStart`、`Array.prototype.includes` 等等  

