---
layout: post
title: iOS 平台 native 调用 React Native functions
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-12-09 18:28:45+0800
sync_link: https://xwenliang.cn/p/5668025db50815352000000a
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


上一篇介绍了 react native 调用 native functions, 其中提到的 js 调用 oc 函数的时候，传递一个回调函数进去，其实已经实现了 oc 调用 js, 只不过这种方法官方给出了一个 Warning:  
  
> `This section is more experimental than others because we don't have a solid set of best practices around callbacks yes.`  

官方还提供了另外一种通过事件来通信的方式：  

分别创建 NativeCallReact.h 和 NativeCallReact.m 两个文件：  

```objective-c
// NativeCallReact.h
#import "RCTBridgeModule.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
@interface NativeCallReact: NSObject &lt;RCTBridgeModule&gt;
@end
```

```objective-c
// NativeCallReact.m
#import "NativeCallReact.h"
@implementation NativeCallReact
@synthesize bridge = _bridge;
RCT_EXPORT_MODULE()
RCT_EXPORT_METHOD(sendEvents){
    [self.bridge.eventDispatcher sendAppEventWithName:@"hello" body:@"i am from native"];
}
@end
```

在 js 中监听这个事件：  

```javascript
import {
    NativeModules,
    NativeAppEventEmitter
} from 'react-native';

//监听上面oc中定义好的事件
NativeAppEventEmitter.addListener('hello', (event) => {
    console.log(event);
});
//触发oc中发射事件的方法
NativeModules.NativeCallReact.sendEvents();
//将打印 i am from native
```

这样就变相实现了 native 调用 react native 中定义的方法了，官方也有提到：  

这样做的好处：  
不需要在 oc 中拿到 js 中的函数就可以执行  

但同时带来的坏处：  
1.事件是在哪里都可以发送的，这样会让你代码的依赖关系不明确  
2.所有的事件是在同一个命名空间下的，不小心会遇到命名冲突等问题，并且很难 debug  
3.如果模块在多处被使用，并且要区分使用方法，那么你可能需要在传递的参数中带一些标识，这给项目的后期维护也带来了困难  

另外 android 平台 native 和 react native 的相互调用，可以看[这里](https://github.com/beefe/doc/issues/1)  

