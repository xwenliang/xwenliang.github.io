---
layout: post
title: webpack4 抽离公共 css 产生的问题
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2018-11-16 14:13:01+0800
sync_link: https://xwenliang.cn/p/5bee5ee3e7c713c569000002
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


webpack4 对 css 的默认处理是同步引用的 [s]css 合并成一个文件，其他异步引用的分别单独打成独立文件  
但是在 [s]css 文件中使用 `@import` 引用的公共模块并不会被抽离出来合并，这导致引用了大量的重复代码，可以看看 sass-loader 其中一个 [issue 对此问题的讨论](https://github.com/webpack-contrib/sass-loader/issues/628)  

我们希望同步引用的 [s]css 文件最终打包成两个 css, 一个是通用的 common.css, 另一个是业务入口相关的 page.css, 这样会使 common.css 中的代码脱离业务，缓存更加长期、稳定  

所以我们考虑实现这么一个 webpack plugin:  

首先解决使用 css entry 带来的[问题](https://github.com/webpack/webpack/issues/1967)，然后将其他所有打包出来的 css 文件 (page.css 和异步 css) 用 css entry 打包出来的文件 (common.css) 全文替换  

然后我们遇到了以下问题：  

### 问题一  

- sass-loader 默认的配置 `options.outputStyle = 'nested'` 会将：  

```scss
body{
    background: green;
}
```

变成：  

```scss
body{
    background: green; }
```

所以我们要把它设置成 `options.outputStyle = 'expanded'` 来保持原状来解决如下场景：  

1. `a.scss` 里面 `@import ./common.css`  
2. sass-loader 会将 `./common.css` 拿到 `a.scss` 里面  
3. 然后包含 `./common.css` 的 `a.scss` 经过 sass-loader 处理变成了 `}` 上移一行的状态  
4. `./common.css` 未经 sass-loader 处理维持原状  
5. 从编译后的 `a.scss` (包含了 `./common.css`) 里面不能搜索到 `./common.css` 的内容，导致删除重复部分失败  
注意：即使设置成 `options.outputStyle = 'expanded'`, sass-loader 仍然会对源文件进行修改，比如有多个空行(非注释中)会变成一个，还有一些代码优化，小数点补0等，所以终极办法是让 css 也走 sass-loader  


### 问题二  

vue 单文件引用的 common.scss 文件中的空行被删除以及嵌套结构的缩进被改写：  

```css
html{
    background: red;
}

body{
    background: black;
}

@-webkit-keyframes bounce {
    from,
    to {
        transform: translateY(3rem) scaleY(0.98);
    }
    80% {
        transform: translateY(2rem) scaleY(1.02);
    }
}
```

变成：  

```css
html{
    background: red;
}
body{
    background: black;
}
@-webkit-keyframes bounce {
from,
  to {
    transform: translateY(3rem) scaleY(0.98);
}
80% {
    transform: translateY(2rem) scaleY(1.02);
}
}
```

我们发现：`html、body、@-webkit-keyframes bounce` 中间的空行被删除同时嵌套结构缩进被改写，而我们的 common.scss 并未被做如上改动，导致公共内容匹配不成功  
猜测是 vue-loader 做的如上处理，经过查看源码发现 `vue-loader/lib/loaders/stylePostLoader.js` 中有如下代码：  

```javascript
//vue-loader@15.4.2
//vue-loader/lib/loaders/stylePostLoader.js

const { code, map, errors } = compileStyle({
    source,
    filename: this.resourcePath,
    id: `data-v-${query.id}`,
    map: inMap,
    scoped: !!query.scoped,
    trim: true
});
```

我们把 `trim: true` 改为 `trim: false` 果然就不会做上述处理了，然而直接修改 `vue-loader` 显然是不可行方案，我们只能继续查看该配置项的内容，通过使用相同的配置来处理我们的 `common.scss`, 这样就可以在编译完成阶段匹配到公共的样式代码块了  

继续追查代码发现，这个 compileStyle 方法是由 `@vue/component-compiler-utils` 提供，而最终是通过 postcss 实现的该 `trim` 功能，所以我们给 scss 文件也配置 postcss 的 `trim` 功能：  

```javascript
{
    loader: postcssLoader,
    options: {
        plugins: () => [
            require('autoprefixer')({
                ...browserList
            }),
            //use same trim as vue-loader's to split common css
            css => {
                css.walk(({ type, raws }) => {
                    if (type === 'rule' || type === 'atrule') {
                        raws.before = raws.after = '\n';
                    }
                });
            }
        ]
    }
}
```

至此，已经可以完美从其他编译后的 css 代码中剔除 common.scss 中的代码块了  

相关库的版本：  
webpack: `4.20.2`  
sass-loader: `7.1.0`  

