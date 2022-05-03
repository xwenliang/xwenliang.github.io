---
layout: post
title: APP 开发的这四个月
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-07-28 14:32:25+0800
sync_link: https://xwenliang.cn/p/55acdd573c64f42b6a000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


从 3 月中旬就开始倒腾 APP 开发，到现在大概 4 个多月的时间，总结一下吧。  

以前天天听人说 PhoneGap、webview, 感觉一副很高大上的样子，如今机会终于来了，却发现效果真的很一般。特别是在一些低端安卓机下，只放一个简单轮播图就会卡成狗，可能代码写的烂也是部分原因，但我觉得大部分原因应该不在这里。  

于是寻求其他的方案，从 Cordova 到 Ionic, 效果都不太理想，iOS 平台上效果很好，到安卓下面就卡成狗，还仅仅只是放了几张轮播图而已。  

再后来，发现了 DCloud HBuilder, 怎么越写越像软文呢...都用人家的服务了，免费安利一下也是应该的吧...看官方给的 demo, 无论 android 和 iOS 都是很流畅的。  

看它的实现原理才知道，比如下拉刷新，android 平台下拉的是整个 webview, 整个 webview 的拉动跟随效果都是原生来实现的，所以会比 dom 的实现方式流畅很多。官方提供了非常丰富的组件，直接拿来用就可以了，非常方便。  

我们就用这套东西，做了我们的产品 1.0 版本。  

iOS 平台效果非常好，但是也有几个瑕疵吧，如输入域可调起的键盘类型寥寥无几，切页动画跟原生稍有差异，跟原生代码只能异步调用等。  

android 平台，效果只能说是勉勉强强。上面 iOS 的问题它都有，并且由于 webview 在 android 平台下的差性能，页面渲染很差，切页的时候页面经常一块一块的出现。切页动画也略有卡顿（可能是我 webview 开多了，有近 10 个常驻的）。仔细优化一下效果应该是可以接受的。  

再后来发现，很多效果如果用原生来实现的话，只是一个 view 或一个组件的问题，而用 web 的方式实现则需要大量的 hack 代码，兼容性也不是很好，并且 webview 毕竟是 webview, 绘制界面、渲染动画的效率远远不如 Native  

突然觉得如果注定只能用 webview 来「模拟」原生应用的话，那这条路肯定不怎么光明。  

还好 ReactNative 来了。虽然目前只有 iOS 端，但借助它我们终于摆脱了 webview 的限制。它依然依赖于各种现有组件，没有的话开发难度相当大，需要对 js 和 oc 都有一定的功底。但我相信这条路是光明的。  

目前正处于使用 ReactNative 重构的阶段，后续会写一些 ReactNative 开发的心得。  

