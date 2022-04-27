---
layout: post
title: iOS 平台 React Native 调用 native functions
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-12-07 21:58:37+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


随着 react-native 开发的继续深入，我们终于来到了 react-native 和 native 相互调用这道坎，本文将介绍 react-native 调用 native functions, 下一篇介绍 native 调用 react-native functions(iOS)  

[官方文档](https://facebook.github.io/react-native/docs/communication-ios.html#calling-native-functions-from-react-native-native-modules)其实写的比较清楚了，感觉这里大部分只是手动把这一过程实践了而已，先想好一个模块的名字，我们以 CallNativeTest 为例：  

分别创建 CallNativeTest.h 和 CallNativeTest.m 两个文件：  

```objective-c
// CallNativeTest.h
#import "RCTBridgeModule.h"
@interface CallNativeTest: NSObject &lt;RCTBridgeModule&gt;
@end
```

```objective-c
// CallNativeTest.m
#import "CallNativeTest.h"
@implementation CallNativeTest
//将模块输出至react-native模块，js中可通过NativeModules.CallNativeTest访问到
RCT_EXPORT_MODULE();
//往该模块添加addEvent方法，js中可通过NativeModules.CallNativeTest.addEvent访问到
RCT_EXPORT_METHOD(addEvent:(NSString *)name location:(NSString *)location){
    NSLog(@"I have got the message %@ at %@", name, location);
}
//添加一个接收函数类型参数的函数
RCT_EXPORT_METHOD(findEvents:(RCTResponseSenderBlock)callback){
    NSString *events = @"abcd";
    callback(@[[NSNull null], events]);
}
@end
```

在 js 中调用：  

```javascript
import {
    NativeModules
} from 'react-native';

NativeModules.CallNativeTest.addEvent('hello native', 'someposition');
//将会在xcode的控制台看到输出：I have got the message hello native at someposition
NativeModules.CallNativeTest.findEvents((error, result) =&gt; {
    if(error){
        console.log(error);
    }
    else{
        console.log(result);
    }
});
//将会在浏览器控制台看到输出：abcd
```

这样就完成了 iOS 平台 react-native 调用 native 提供的方法了，其实后面定义的接收[函数类型参数]的函数已经可以实现在 oc 中调用 js 定义的方法了，但还是 js 主动调用 oc 才能实现，我们还需要 oc 主动调用 js, 也就是下一篇要写的内容。  

