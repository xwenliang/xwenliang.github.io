---
layout: post
title: 微信页面开发中遇到的坑
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-12-25 15:51:43+0800
sync_link: https://xwenliang.cn/p/549bc1d96c1351e664000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最近做了几个微信的活动页，总结一下遇到的问题。  

1.首先遇到的是，各种小米的机型，`window.innerHeight` 获取到的不是 css pixel, 居然是 device pixel...  

> css pixel(css 像素), 指的是 css 样式代码中使用的逻辑像素，比如定义 body 的宽度为 320px. device pixel(设备像素), 指的是设备的像素，比如 iPhone 的分辨率为 640×1136px  

那么这个 css pixel 和 device pixel 有什么关系呢？这就需要先了解 [device pixel ratio(设备像素比)](http://www.devicepixelratio.com/)了，解了它以后，咱们知道了 css 中 1px 并不一定等于设备的 1px, 是要根据这个 device pixel ratio 来计算得出的。  

所以，咱们常用的设计稿宽度一般是 640px, 而我们在写页面的时候，一般把宽度定义为 320px. 这是因为大多数机型的像素比都是 2:1  
  
我们要获取的是 css 像素，获取个设备像素有什么用啊？后来发现，将 `window.innerHeight` 放到微信自带的 `WeixinJSBridgeReady` 事件的回调中，就能正常获取到 css 像素了：  

```javascript
document.addEventListener('WeixinJSBridgeReady', function(){
    var height = window.innerHeight;
}, false);
```

这东西是不是让你想到了 document 的 ready 事件？在人屋檐下，不得不低头啊...  
 
2.微信提供的分享给好友和分享到朋友圈接口的 bug, 试了几个魅族2, 均发现 `menu:share:appmessage` 和 `menu:share:timeline` 这两个事件的回调函数不能执行，分享成功后需要手动点一下屏幕才会触发。  

后来分别把他们的回调函数延迟 200ms 再执行，就一切正常了...  

测试微信版本：`6.0.1`  

