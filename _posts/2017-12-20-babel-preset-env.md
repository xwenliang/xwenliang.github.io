---
layout: post
title: babel-preset-env 前端狗的又一个福音
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2017-12-20 20:28:44+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


之前的文章提到[我的小伙伴踩中了 babel 的坑](https://xwenliang.github.io/backend/2017/11/16/why-babel.html)，当时只是找到了问题的原因，然后给了一个比较潦草的解决方法：直接引入低版本浏览器不兼容的 API. 但是在实际开发中我们不可能熟知各个浏览器对 API 的兼容情况，导致只能报错之后再去补救，显然这不是个优秀的方案，下面我们就探讨一下如何优雅的避免此类问题的发生。  

先尝试使用 vue-cli [构建项目](https://github.com/xwenliang/xwenliang.github.io/tree/master/repro/test-vue-cli)，我们发现它的初始模版中同时配置了 `babel-preset-env` 和 `babel-plugin-transform-runtime`：  

```json
{
  "presets": [
    ["env", {
      "modules": false,
      "targets": {
        "browsers": ["> 1%", "last 2 versions", "not ie <= 8"]
      }
    }],
    "stage-2"
  ],
  "plugins": ["transform-vue-jsx", "transform-runtime"],
  "env": {
    "test": {
      "presets": ["env", "stage-2"],
      "plugins": ["transform-vue-jsx", "transform-es2015-modules-commonjs", "dynamic-import-node"]
    }
  }
}
```

由于 `babel-preset-env` 并没有开启 `useBuiltIns`, 且模版代码中也没有引入 polyfill, 导致不太熟悉 babel 环境的同学直接拿来用会[踩到坑](https://xwenliang.github.io/backend/2017/11/16/why-babel.html)  

我们尝试在 main.js 中加入以下代码：  

```javascript
const test = 'abcd';
alert(test.includes('a'));
```

编译后在 IE9 打开果然是报错了：  

> `SCRIPT438: 对象不支持“includes”属性或方法`  

修改为以下代码才能正常执行：  

```javascript
//手动添加polyfill
import 'core-js/modules/es6.string.includes'
const test = 'abcd';
alert(test.includes('a'));
```

但是这么做就会遇到上面所说的问题，我们不可能熟知每一个 API 的兼容情况，导致有遗漏或者多余。有没有什么插件会根据配置好的对浏览器的支持程度来自动做 polyfill 呢。  

[babel-preset-env](https://babeljs.io/docs/plugins/preset-env/) 就是干这件事情的，比如它会根据如下配置来对「大部分浏览器最新的两个版本以及 safari 7+ 」进行 polyfill, 包括语法和 API:  

```json
{
  "presets": [
    ["env", {
      "targets": {
        "browsers": ["last 2 versions", "safari >= 7"]
      }
      "useBuiltIns": true
    }]
  ]
}
```

这样就解决了上面提到的问题，我们不需要关心每个 API 在各个浏览器的兼容情况，我们只需要知道要兼容哪些浏览器就可以了。  

既然如此，为什么 vue-cli 生成的模版还同时引入了 `babel-plugin-transform-runtime` 呢？恰巧我在 [segmentfault](https://segmentfault.com/q/1010000012181998) 看到了相同的问题。  

经过查证发现，原因是 `babel-preset-env@1.x` 没法很好地消除未使用的 polyfill (就是说有未使用的代码被引入进来了), 如果希望避免这一点，就会禁用 `useBuiltIns: true`, 用更好的 `transform-runtime` 代替。  

详情可见：  
[babel/babel-preset-env#84](https://github.com/babel/babel-preset-env/issues/84)  
[babel/babel-preset-env#241](https://github.com/babel/babel-preset-env/pull/241)  

可以看到 [vuejs-templates/webpack](https://github.com/vuejs-templates/webpack/blob/f93e45bb59e5a3438b6404cf77336f40d1c7fcb9/template/package.json#L92) 引入的是 **1.3** 的 `babel-preset-env`  

我们还可以去 [Bebel REPL](https://babeljs.io/repl) 尝试一下：  

1.开启左侧菜单下方 Env Preset  
2.输入浏览器版本  
3.勾选 Built-ins  

然后左侧代码栏输入：  

```javascript
import 'babel-polyfill';
```

就会发现右侧会根据输入的浏览器版本生成与之对应的依赖注入代码，不管有没有用到，只要是当前浏览器环境不支持的，全部都会注入:  

```javascript
//我输入的浏览器版本是chrome 52
"use strict";
require("core-js/modules/es7.object.values");
require("core-js/modules/es7.object.entries");
require("core-js/modules/es7.object.get-own-property-descriptors");
require("core-js/modules/es7.string.pad-start");
require("core-js/modules/es7.string.pad-end");
require("core-js/modules/web.timers");
require("core-js/modules/web.immediate");
require("core-js/modules/web.dom.iterable");
```

而在 [babel-preset-env@2.x](https://github.com/babel/babel/tree/master/packages/babel-preset-env) 中已经完全可以用 `useBuiltIns: usage` 来达到按需引入的目的，也就是说不再需要 `transform-runtime` 了，并且也不再需要在代码中手动引入 `babel-polyfill` 了（但是还需要安装，因为编译后的代码依赖了它），显然这是一个很优秀的方案：  

编译前：  

```javascript
var a = new Promise();
var b = new Map();
```

编译后(浏览器环境不支持 Promise 和 Map):  

```javascript
import "core-js/modules/es6.promise";
import "core-js/modules/es6.map";
var a = new Promise();
var b = new Map();
```

编译后(浏览器环境不支持Map):  

```javascript
import "core-js/modules/es6.map";
var a = new Promise();
var b = new Map();
```

相关版本：  
vue-cli: `2.9.3`  
nodejs: `6.1.0`  

