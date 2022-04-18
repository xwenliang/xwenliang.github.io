---
layout: post
title: 微信小程序与微信小游戏
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2020-02-25 01:43:36+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最近在折腾使用 cocos creator 开发运营类小游戏，这确实是一款很棒的游戏开发软件，集成了整套的开发调试工具与跨平台编译支持，目前支持编译到绝大多数平台，甚至最近几年比较火的各种小游戏平台，一些经典游戏如《保卫萝卜》、《开心消消乐》等都是用此工具开发 (微信官方欢乐斗地主小游戏是用 cocos2d-js 开发) ，还是比较靠谱的。

由于我们的需求场景主要在微信平台，所以重点使用了其编译至 H5 端和小游戏端，在试用了微信的官方案例 - [tutorial-blackjack](https://github.com/cocos-creator/tutorial-blackjack) 后，感觉在微信小游戏端的体验确实很不错，并且同样的代码无需任何更改即可编译至微信小游戏和 H5 端双平台，唯一遗憾的是目前最新的版本 `v2.3.0` 仍不能编译至微信小程序，官方明确回复了应该[不会予以支持](https://forum.cocos.org/t/cocos/39940/7)，并且存在[以下问题](https://forum.cocos.org/t/topic/41002/6)：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-4-18-9aefd5895d.jpg)  

这都是2016年11月份的老帖子了，时至今日微信小程序也有了诸多更新，比如  `globalAlpha` 的支持、 `WebGL`的支持(2.7.0) 、 `drawImage` 已经从原来的5个参数更新为标准的9个参数，且参数功能也和标准一致等等。

但我们的需求场景主要是运营类小游戏，所以产品不希望一个一个去做单独的小游戏，而是希望能把若干个小游戏做到一个小程序账号上，这样既方便运营管理又可以解决微信多个小游戏之间的跳转提示弹窗。从纯技术的角度出发，小游戏只是小程序的一个子集，小程序拥有许多小游戏做不到的事情，比如扫码、打开APP等功能，如果能把小游戏做到小程序的一个页面里确实有许多好处，比如共享小程序登录态、方便管理代码等。但是这么做也有诸多挑战，比如单包2M总包8M的大小限制、引擎支持的缺失等问题。

---

下面我们着重讲述在把微信小游戏移植到微信小程序中遇到的问题和解决思路，我们以微信的官方小游戏 - [「打飞机」](https://github.com/xwenliang/xwenliang.github.io/tree/master/repro/mini-game-quickstart/)为例。

一些环境的差异就不细说了，诸如 window 对象、事件绑定方式、canvas 获取方式、video/audio 的创建方式等。

我们首先遇到的坑，就是微信提供的**开发工具环境和真机环境并不一致**，导致我们前期在开发工具环境中摸索的各种hack方法和经验最终在真机下几乎全面崩溃，拿一个当时我写的文档来看一下：  
> canvas的异同  
> 
> 小游戏 `wx.createCanvas()` 返回的是一个 canvas dom节点，类似 `<canvas id="myCanvas" width="320" height="568">`, 具有 `addEventListener` 等 dom 节点方法，其他方法像 `requestAnimationFrame` 则挂在全局对象 `window` 上。  
> 
> 小程序 `wx.createSelectorQuery()` 返回的是一个对象，具有 `createImage` 、 `requestAnimationFrame` 等专有方法，其他 dom 方法如 `addEventListener` 则挂在 `_canvasRef` 属性返回的 dom 节点上，且没有 `window` 这个全局对象。  


等我们拿到真机上发现，其实并不存在什么 `_canvasRef` 这个属性，只有一个被包装了的看起来像是 canvas 的对象。所以任何的尝试一定要拿到真机上再出结论，不要相信开发工具环境。

然后就是真机调试的时候各种莫名其妙的报错，搜索了官方论坛才知道，原来 [canvas2d 和 webgl 暂不支持真机调试，请直接使用真机预览](https://developers.weixin.qq.com/community/develop/doc/00044ee36e04601f236971e5c50000)，那么问题来了，真机预览还怎么调试呢，好在还有个 vconsole 能用，但是让我们看一下它的报错信息：  

![mini-game-error](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-4-18-2cf66f2f83.jpg)  

你能看出来这是因为小程序缺少小游戏的 `Audio` 类而报的错吗...

再举一个API差异的例子，官方小游戏 quickstart 中 `js/runtime/music.js#L31` 的这行代码：`this.shootAudio.currentTime = 0` 是用来处理短时间内击中两个飞机的时候所产生的音效叠加问题，处理方式很暴力：如果当前的爆炸声音没有播放完也马上停止并播放下一架飞机的爆炸声音，这在小程序开发环境下是没有问题的，真机环境下却报错：  
> TypeError: Attemped to assign to readonly property  

查看文档发现它是只读属性，并且小程序和小游戏的文档中都描述它为只读属性：  
> `number currentTime`  
> 当前音频的播放位置（单位 s）。只有在当前有合法的 src 时返回，时间保留小数点后 6 位（只读）  

我又去尝试了__小游戏__的开发环境和真机环境，发现这么做__居然是可以的__...

无奈中又发现了一丝曙光，看到正好有个 `InnerAudioContext.seek(number position)`, 它应该也可以做同样的事情，然而却在小程序开发环境中报错：  
> TypeError: this.shootAudio.seek is not a function  

抱着试试看的态度，拿真机尝试下，没想到__居然是可以的__...真是一波三折 - -!!

解决了这些API的差异后，我们还面临一个问题：正常的小游戏切到后台或退出的时候，微信会帮你管理，把小游戏暂停或退出，而我们既然是做到了小程序中，那在装载了小游戏的页面退出后，我们就要自己去管理小游戏的暂停或退出了。不过这也不难做到，只是一个需要值得注意的地方。

以下是一个把微信官方小游戏 quickstart 转成小程序的 demo:    
[mini-game-quickstart-in-mini-program](https://github.com/xwenliang/xwenliang.github.io/tree/master/repro/mini-game-quickstart-in-mini-program)  

相关环境：  
Wechat Devtools: `1.02.1911180`  
Debug Base Library: `2.10.1`  
macOS High Sierra: `10.13.6`  
Wechat: `7.0.10`  
iOS: `12.4`  

