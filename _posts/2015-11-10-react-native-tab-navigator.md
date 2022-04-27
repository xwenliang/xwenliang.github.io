---
layout: post
title: react-native-tab-navigator 引发的血案
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-11-10 18:43:16+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


React Native for Android 自从 9 月 15 日发布至今已经近两个月了，喜欢折腾的小伙伴们早已做出了不少的例子，当然我们也跃跃欲试了，但过程中踩到一些坑是免不了的  

其中最大的问题，应该是一些组件在 iOS 平台已经很完善，但 Android 平台却依然处于 todo 状态，典型的当属 TabBarIOS 这个组件，也许这种底部固定 tab 的 UI 是 iOS 风格 UI 的缘故，名字都起成了 iOS 结尾...  

进入这个组件的目录，通常位于：`项目/node_modules/react-native/Libraries/Components/TabBarIOS`, 我们会发现四个文件：  
TabBarIOS.android.js,  
TabBarIOS.ios.js,  
TabBarItemIOS.android.js,  
TabBarItemIOS.ios.js  

以 .android.js 和 .ios.js 结尾的文件，分别对应了 Android 和 iOS 平台的代码，打开安卓平台的代码，发现里面寥寥的几行，根本无法使用，也就是说，这个功能还处于 todo 状态...  

去官方 issue 找到这么一条问题：[#issue3122](https://github.com/facebook/react-native/issues/3122)  

官方开发者 astreet 的回答发人深醒：  

> android 平台和 iOS 平台本就是风格有很大不同的两个平台，没有必要为了统一 UI 而去做一些违反平台设计原则的东西，但同时他也相信，会有这种组件出现的 :)  

但我们的设计师确实是把 android 和 iOS 平台的风格设计成基本一样的了，还好官方开发者 ide 祭出了他为 android 平台写的一个第三方组件：  

[react-native-tab-navigator](https://github.com/exponentjs/react-native-tab-navigator)  

起初并不知道如何安装这个第三方组件，先直接装到项目根目录下的 node_modules 目录下试试吧：  

在项目目录执行 `npm install react-native-tab-navigator --save`, 然后去官方 github 上找到示例代码，发现组件确实能被正确的引用到，但是报了很多的语法错误，打开这个组件的代码，发现用了两个 es7 的特性，分别是 [classproperties](https://github.com/jeffmo/es-class-static-properties-and-fields) 和 [decorators](https://github.com/wycats/javascript-decorators)  

然后去官方 issue 转了一圈，发现确实有人遇到了类似问题，解决方法是在项目根目录中新建一个 .babelrc 文件：  

```json
{
	"retainLines": true,
	"compact": true,
	"comments": false,
	"whitelist": [
		"es6.modules",
		"es7.classProperties",
		"es7.decorators",
		"regenerator",
		"flow",
		"react",
		"react.displayName"
	],
	"sourceMaps": false
}
```

这样 react-native 在编译打包的时候会对这些 es7 的语法做兼容处理。然而增加了这个文件后，依然没有解决报错，这时候就有种束手无策的感觉了。根据以往的经验，会不会是代码有更新呢。  

赶紧查看下，当前 react-native 的版本是 `0.12.0`, 而官方的 stable 版本已经发布到了 `0.14.2`, 果断更新，然后是漫长的等待，更新就绪后再运行，发现还有报错：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-28-3df1d3c211.jpg)  

这个报错总算让我看到了希望，因为这表示先前的语法错误都已经解决，这报的是执行阶段的错误啊！看了下代码，发现可能是由于 StatusBarIOS 这个组件没有引入导致的，先不管它，果断删掉，再运行，终于跑起来了：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-28-4c707d18db.jpg)  

示例代码：  

```javascript
'use strict';

let React = require('react-native');
let {
    AppRegistry,
    Image,
    StatusBarIOS,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} = React;
let TabNavigator = require('react-native-tab-navigator');

class HiddenTabBarDemo extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            selectedTab: 'home',
            showTabBar: true,
        };
    }

    render() {
        let tabBarStyle = {};
        let sceneStyle = {};
        if (!this.state.showTabBar) {
            tabBarStyle.height = 0;
            tabBarStyle.overflow = 'hidden';
            sceneStyle.paddingBottom = 0;
        }

        return (
        <TabNavigator tabBarStyle={tabBarStyle} sceneStyle={sceneStyle}>
            <TabNavigator.Item
                selected={this.state.selectedTab === 'home'}
                title="Home"
                onPress={() => this.setState({ selectedTab: 'home' })}>
                <View style={styles.scene}>
                    <TouchableOpacity onPress={this._toggleTabBarVisibility.bind(this)}>
                        <Text style={styles.button}>
                            {this.state.showTabBar ? 'Hide Tab Bar' : 'Show Tab Bar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TabNavigator.Item>
            <TabNavigator.Item
                selected={this.state.selectedTab === 'profile'}
                title="Profile"
                onPress={() => this.setState({ selectedTab: 'profile' })}>
                <View style={styles.scene}>
                    <Text style={{ color: '#fff' }}>Profile</Text>
                </View>
            </TabNavigator.Item>
        </TabNavigator>
        );
    }

    _toggleTabBarVisibility() {
        this.setState(state => ({
            showTabBar: !state.showTabBar,
        }));
    }
}

let styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scene: {
        backgroundColor: '#1e2127',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        color: '#007aff',
        fontWeight: '600',
    }
});

StatusBarIOS.setStyle('light-content');

AppRegistry.registerComponent('main', () => HiddenTabBarDemo);
```

