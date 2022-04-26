---
layout: post
title: 再谈 webpack-dev-server 之 proxy
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2018-04-23 17:26:25+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


今天在折腾 proxy 代理的时候，遇到了这么个需求：只匹配不包含 `/js/` 的路径，然后理所当然的认为 proxy 的路径应该是支持正则匹配的，不匹配某个特定组合的字符需要用到[零宽度负预测先行断言(?!exp)](https://www.w3schools.com/jsref/jsref_regexp_nfollow_not.asp)：`^(?!.*\/js\/).*$`  

然而并没有起任何作用，似乎并没有匹配到任何路径。查遍了官方文档也没有找到可以打印代理日志的方法，只能去 webpack-dev-server 的代码里打断点来调试了。然后看到它是使用了 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) 来实现的 proxy, 这一点官网倒是[有所提及](https://webpack.js.org/configuration/dev-server/#devserver-proxy), 打开 `http-proxy-middleware` 的代码发现有这么行代码：  

```javascript
// debug logging for both http(s) and websockets
if (proxyOptions.logLevel === 'debug') {
    var arrow = getArrow(originalPath, req.url, proxyOptions.target, newProxyOptions.target);
    logger.debug('[HPM] %s %s %s %s', req.method, originalPath, arrow, newProxyOptions.target);
}
```

然后我们尝试在 `webpack-dev-server` 中的 `proxy` 中添加 `logLevel` 字段：  

```javascript
proxy: {
    '^(?!.*\/js\/).*$': {
        target: 'xxx',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
    }
}
```

发现仍然不会显示代理日志，想到可能根本没有匹配成功，所以没有显示。先看看到底路径是怎么匹配的吧。然后我们最终找到在 `node_modules/http-proxy-middleware/lib/context-matcher.js` 中是这么匹配路径的：  

```javascript
//以下是简化的示意代码：

// single path
if (_.isString(context) && !isGlob(context)) {
    return matchSingleStringPath(context, uri);
}
// single glob path
if (isGlob(context)) {
    return matchSingleGlobPath(context, uri);
}

function matchSingleStringPath(context, uri) {
    var pathname = getUrlPathName(uri);
    return pathname.indexOf(context) === 0;
}
function matchSingleGlobPath(pattern, uri) {
    var pathname = getUrlPathName(uri);
    var matches = micromatch(pathname, pattern);
    return matches && (matches.length > 0);
}
```

上面代码中 `context` 指的是 proxy 中的正则 `'^(?!.*\/js\/).*$'`, `isString` 用的是 [lodash](https://github.com/lodash/lodash/blob/master/isString.js), 还有个 [isGlob](https://github.com/micromatch/is-glob) 这是我之前没有接触到的。看了官方文档后了解到 `glob` 是一种匹配路径的规则，**它并不是正则**，[维基百科](https://en.wikipedia.org/wiki/Glob_(programming)上这样解释：  

> In computer programming, in particular in a Unix-like environment, glob patterns specify sets of filenames with wildcard characters.

我们看下面几个例子来大致了解下这个 glob:  

```javascript
//globs
isGlob('!foo.js');//true
isGlob('*.js');//true
isGlob('**/abc.js');//true
isGlob('abc/*.js');//true
isGlob('abc/(aaa|bbb).js');//true
isGlob('abc/[a-z].js');//true
isGlob('abc/{a,b}.js');//true
//extglobs
isGlob('abc/@(a).js');//true
isGlob('abc/!(a).js');//true
isGlob('abc/+(a).js');//true
isGlob('abc/*(a).js');//true
isGlob('abc/?(a).js');//true
//Escaped globs or extglobs
isGlob('abc/\\@(a).js');//false
isGlob('abc/\\!(a).js');//false
isGlob('abc/\\+(a).js');//false
isGlob('abc/\\*(a).js');//false
isGlob('abc/\\?(a).js');//false
isGlob('\\!foo.js');//false
isGlob('\\*.js');//false
isGlob('\\*\\*/abc.js');//false
isGlob('abc/\\*.js');//false
isGlob('abc/\\(aaa|bbb).js');//false
isGlob('abc/\\[a-z].js');//false
isGlob('abc/\\{a,b}.js');//false
```

如果是正则字符串 `isGlob` 也会返回 `true`, 例如 `isGlob('.*');//true`, 但是最终执行匹配的 [micromatch](https://github.com/micromatch/micromatch) 却**不会**把以上正则字符串里的 `.` 理解为任意字符，而只会当成一个普通的字符来处理：  

```javascript
import micromatch as mm from 'micromatch';
let matches = mm(['a.js', '.js'], '.*');
console.log(matches); // ['.js']
```

而 `?*+!` 这些也会被翻译成他们最基本的意思，`?` 表示 0 次或 1 次，`*` 表示 0 次 1 次或多次，`+` 表示 1 次或多次，`!` 表示 0 次。并且在此基础上有一些补充，比如 `@(pattern)` 表示只匹配 `pattern`, `!(pattern)` 表示非 `pattern`, 所以我们上面所写的正则 `'^(?!.*\/js\/).*$'` 不会匹配到任意不包含 `/js/` 的路径，而应该使用 `!(pattern)`, 我们来尝试下：  

```javascript
import micromatch as mm from 'micromatch';
let matches = mm(['/a/js/b.js', 'js/a/b.js', '/a/b/js.js'], '!(**/js/**)');
console.log(matches); // ['js/a/b.js', '/a/b/js.js']
```

果然匹配到了不包含 `/js/` 的路径，至于为什么要使用 `**` 而不是 `*`, 是因为前者匹配可以忽略目录，而后者只能到目录：  

```javascript
import micromatch as mm from 'micromatch';
mm(['a/b.js', 'b.js'], '*'); // ['b.js']
mm(['a/b.js', 'b.js'], '**'); // ['a/b.js', 'b.js']
```

所以我们这个 proxy 的配置应该是：  

```javascript
proxy: {
    '!(**/js/**)': {
        target: 'xxx',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
    }
}
```

重启 devServer 后，我们可以看到 proxy 的代理日志了，说明 `logLevel` 配置生效了。但是带有 `/js/` 的路径也被代理了，为什么会这样呢？  

经过对比发现，在写测试代码的时候用的是 `micromatch@3.1.10` 而 `http-proxy-middleware@0.17.4` 用的是 `micromatch@2.3.11`, 很明显这个版本是有某些 bug 的：  

```javascript
//micromatch@2.3.11
import micromatch as mm from 'micromatch';
mm('a/b/js/c/d.js', '!(**/js/**)'); // ['a/b/js/c/d.js']
mm('a/b/js/c/d.js', '**/js/**'); // ['a/b/js/c/d.js']

//micromatch@3.1.10
import micromatch as mm from 'micromatch';
mm('a/b/js/c/d.js', '!(**/js/**)'); // []
mm('a/b/js/c/d.js', '**/js/**'); // ['a/b/js/c/d.js']
```

在去官方 github 求证后，得到了[肯定的答复](https://github.com/micromatch/micromatch/issues/126)，`micromatch@2.x` 确实是有 bug 的。  

很不幸直到 `http-proxy-middleware@0.18.0` 才引用了正确的 `micromatch@3.x`, 而直到 `webpack-dev-server@3.1.2` 才引用了正确的 `http-proxy-middleware@0.18.x`, 也就是说在这之前的所有版本，proxy 在**匹配路径上都是存在问题的**  

最终我是通过在 [before](https://webpack.js.org/configuration/dev-server/#devserver-before) 中针对该路由进行拦截实现了这个需求：  

```javascript
before: app => {
    app.get(/^.*\/js\/.*$/g, (req, res) => {
        return res.redirect('local router by webpackDevServer');
    });
},
proxy: {
    '**': {
        target: 'xxx',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
    }
}
```

被 before 拦截的请求就不会再走到 proxy, 所以我们在 proxy 中代理所有请求就好了。  
需要注意的是，本地相对应的路径中不能再包含 `/js/`, 否则就进入死循环了。  

