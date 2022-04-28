---
layout: post
title: 升级到 Xcode7.0 所踩到的坑
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-09-22 19:50:43+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


今天手抖，点了 Xcode 的更新提示，更新完后发现 APP 果然跑不起来了，报错截图：  
  
![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-29-b47c5524cf.jpg)  

由于目前采用的还是 webview 的方案，所以必不可少的要加载一些 web 资源，直观的看上去，是这些资源由于某些原因导致加载失败，所以 APP 白屏了。  

赶紧搜索了一番，发现是 iOS9 新引入的 App Transport Security 的原因，它要求 APP 访问的网络必须是 https 协议，想来应该是为了应对这次的 XcodeGoast 事件吧。  

但是开发阶段再去搞个 https 的域不太现实啊，并且如果 APP 引用了一些第三方的网络资源呢。想来肯定是可以设置白名单的吧。  

应对方案有两种：  

1. 干脆把这个限制去掉，允许加载所有资源(这真是浪费了苹果的苦心)，给 info.plist 文件添加如下配置：  

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true>
</dict>
```

2. 设置 http 白名单，这种方法虽然麻烦，但个人觉得比较靠谱，允许加载的资源更可控。给 info.plist 添加如下配置：  

```xml
<!--以放行 baidu.com 和 qq.com 两个域下的资源为例：-->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>baidu.com</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
        <key>qq.com</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

还有另外一个坑，原来的分享功能，在 iOS9 下也无法正常跳转了。这是因为新增了跳转规则，在跳转到其他客户端时，要首先检测项目的 info.plist 文件有没有配置要跳转平台的白名单，如果没有配置，则将不能正常跳转。想来这也是为了防止 APP 被篡改代码后随便跳转到其他客户端，增加 APP 的安全性做的措施吧。  

以下是常用几大平台的白名单配置：  

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
	<string>sinaweibo</string>
	<string>sinaweibosso</string>
	<string>TencentWeibo</string>
	<string>tencentweiboSdkv2</string>
	<string>wechat</string>
	<string>weixin</string>
	<string>mqzoneopensdk</string>
	<string>mqzoneopensdkapi</string>
	<string>mqzoneopensdkapi19</string>
	<string>mqzoneopensdkapiV2</string>
	<string>mqqOpensdkSSoLogin</string>
	<string>mqqopensdkapiV2</string>
	<string>mqqopensdkapiV3</string>
	<string>wtloginmqq2</string>
	<string>mqqapi</string>
	<string>mqqwpa</string>
	<string>mqzone</string>
	<string>mqq</string>
</array>
```

至此，APP 基本又恢复正常了。  

