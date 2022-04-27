---
layout: post
title: React Native Navigator 小结
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-11-24 17:59:13+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


双平台的开发工作进展到 60% 了，代码的可复用程度高的惊人，配合 ES6 的 [spread](http://tc39wiki.calculist.org/es6/spread/), 只需要添加寥寥数行代码就可以很好的兼容双平台。  

回头细化代码的时候，发现 iOS 有个坑，更确切的说是 [NavigatorIOS](https://github.com/facebook/react-native/issues/1341) 的坑，具体表现在：  

如果设置隐藏 navigationBar, 那么右滑返回手势将失效，并且官方开发者明确表示，这是[ Apple 平台的特性](http://holko.pl/ios/2014/04/06/interactive-pop-gesture/)，他们将不会对此做支持  

Android 平台也有问题，返回的时候，会在大概 1/3 的位置卡顿一下，但是我们查看了 Navigator 组件的代码，发现默认启用的动画配置是：  

```javascript
//node_modules/react-native/Libraries/Components/CustomComponents/Navigator/Navigator.js 268行
getDefaultProps: function() {
  return {
      configureScene: () => NavigatorSceneConfigs.PushFromRight,
      sceneStyle: styles.defaultSceneStyle,
  };
}
```

而这个 NavigatorSceneConfigs.PushFromRight 引用的是：  

```javascript
//与上面代码文件同目录的NavigatorSceneConfigs.js 487行
var BaseConfig = {
  // A list of all gestures that are enabled on this scene
  //此处是开启右滑返回手势
  gestures: {
    pop: BaseLeftToRightGesture,
  },

  // Rebound spring parameters when transitioning FROM this scene
  springFriction: 26,
  springTension: 200,

  // Velocity to start at when transitioning without gesture
  defaultTransitionVelocity: 1.5,

  // Animation interpolators for horizontal transitioning:
  animationInterpolators: {
    into: buildStyleInterpolator(FromTheRight),
    out: buildStyleInterpolator(FadeToTheLeft),
  },
};

var NavigatorSceneConfigs = {
  PushFromRight: {
    ...BaseConfig,
    // We will want to customize this soon
  }
  //其他定义好的动画
};
```

我们可以看到，这个动画配置里面有一系列的相关参数，其中与动画过程相关的就是 animationInterpolators 这个属性，它分别定义了进场和出场的动画（这些进出场动画在该文件顶部都有定义），了解了这些配置，我们就可以灵活定义各种进出场动画了，例如：  

```javascript
<Navigator  
	style={styles.container}
	ref={(navigator) => {
		if(navigator !== this._navigator){
			this._navigator = navigator;
		}
	}}
	initialRoute={{
		component: Index,
		passProps: { 
			selectedTab: 2,
		},
	}}
	renderScene={(route, navigator) => {
		var Component = route.component;
		return (
			<Component navigator={navigator} {...route.passProps} />
		);
	}}
	//配置动画
	configureScene={(route) => {
		if(route.sceneConfig){
			return route.sceneConfig;
		}
		var sceneConfig = {
		    //下面一行定义了想要继承哪个动画的属性
			...Navigator.SceneConfigs.FloatFromRight,
            //此处书写想要改变的属性，如定义进出场动画的animationInterpolators等
		};
		return sceneConfig;
	}}
/>
```

涉及到 iOS 平台，要么不隐藏 navigationBar, 使用 NavigatorIOS 自带的右滑返回，如果一定要隐藏 navigationBar, 那就只能使用 Navigator, 然后定义一组跟原生进出场动画相同的动画了。  

react-native: `0.14.2`  

