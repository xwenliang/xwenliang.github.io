---
layout: post
title: 对 peerDependencies 的理解
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2018-05-09 16:02:03+0800
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最近在搞 webpack@4.x 的时候，安装各种插件后总是会出现 `UNMET PEER DEPENDENCY` 这个东西，它到底是个什么错误呢？在通读了 [Domenic Denicola](https:/www.linkedin.com/in/domenicdenicola/) 的[这篇文章](https:/blog.domenic.me/peer-dependencies/)后，才有了个大致的理解  

我还记得刚接触 node(node<5.0, npm<3.0) 的时候，依赖是层层安装的，比如某个项目同时依赖了 a 和 b, a 和 b 又同时依赖了 c, 那么项目的结构会是这样的：  

|--a--c  
|--b--c  

是的，c 会被安装两次，虽然看起来有些蠢，但这很好的解决了 a 和 b 可能会同时依赖不同版本的 c 的情况  

后来(node>=5.0, npm>=3.0)的时候做了一些优化，还是上面的例子，如果 a 和 b 所依赖的 c 在同一个版本区间，那么将会只装一个 c, 并且装到顶层和 a、b 同级：  

|--a  
|--b  
|--c  

更详细的规则在我的[这篇文章](https://xwenliang.github.io/backend/2016/03/09/npm-flat-dependencies.html)中有提到。这样就解决了重复安装的问题，但是还有一个问题没有得到解决，那就是插件的问题。比如我们发布了一个名字叫做 `webpack-plugin-a` 的插件，他只是 `webpack` 的一个插件，并不依赖 `webpack`, 所以不会把 `webpack` 写入自身的 `dependencies` 或者 `devDependencies`, 但是它又确实需要针对特定的 `webpack` 版本来进行开发。设想以下场景：  

1.我们开发 `webpack-plugin-a@1.0.0` 的时候是针对 `webpack@2.0.0` 来开发的  
2.`webpack` 发布了最新的 `webpack@3.0.0` 并且做了不兼容升级，导致 `webpack-plugin-a@1.0.0` 已经不能在该版本使用  
3.有不明真相的开发者，安装了 `webpack@3.0.0` 和我们的 `webpack-plugin-a@1.0.0`  

悲剧发生了，由于 `webpack` 版本不兼容，当该开发者执行编译的时候肯定是要报错的。那么如何避免这种问题的发生呢？聪明的 npm 维护者们想到了使用 `peerDependencies` 来指定所需要兼容的宿主包的版本，我们在 `webpack-plugin-a@1.0.0` 的 `package.json` 中添加如下配置：  

```json
"peerDependencies": {
    "webpack": "^2.0.0"
}
```

这样就指定了 `webpack-plugin-a@1.0.0` 只兼容 `webpack@2.x.x`, 当用户同时安装 `webpack@3.0.0` 和 `webpack-plugin-a@1.0.0` 的时候就会抛出：  

> UNMET PEER DEPENDENCY webpack@3.0.0  
> npm WARN webpack-plugin-a@1.0.0 requires a peer of webpack@^2.0.0 but none was installed  

以上提示，足够让开发者认识到当前所存在的风险了，该特性添加于 `Node.js 0.8.19(npm 1.2.10)` 版本  

