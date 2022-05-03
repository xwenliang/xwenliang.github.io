---
layout: post
title: React Native TextInput 标签左右对齐的坑
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2016-05-06 19:48:47+0800
sync_link: https://xwenliang.cn/p/572c849f866ef7873c000041
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


相信大家经常遇到如下设计：  
  
![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-27-788660ca91.jpg)  
  
上图授权码处，左边一个 Text 做 label, 右边 TextInput 默认显示 placeholder 提示用户输入，web 端大家都会用 `flex(inline-block)+line-height` 来分分钟搞定它，然而到了 RN 端这个问题却好像没那么简单了：  
  
RN 里面的 line-height 并不是 web 端的那种效果，并不能通过设置 `height=lineHeight` 来使内容居中，具体效果：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-27-b0eb556a3a.jpg)  

机智的开发者们想到了 `justifyContent: 'center'`, 然而这个属性是 View 才具有的，没关系 text 和 TextInput 一人包一个 View:  

```html
<View style={styles.textInput}>
    <View style={styles.labelWrap}>
        <Text style={styles.label}>授权码</Text>
    </View>
    <View style={styles.inputWrap}>
        <TextInput
            style={styles.input}
            placeholder="请粘贴您的授权码"
            underlineColorAndroid='rgba(0,0,0,0)'
        />
    </View>
</View>

let styles = StyleSheet.create({
    textInput: {
        marginTop: 50,
        flexDirection: 'row',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#ccc'
    },
    labelWrap: {
        height: 40,
        justifyContent: 'center'
    },
    label: {
        fontSize: 14
    },
    inputWrap: {
        height: 40,
        justifyContent: 'center'
    },
    input: {
        height: 40,
        width: 250,
        fontSize: 14
    }
});
```

然而运行结果并不是想象中的那样：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-27-1a3ecde260.jpg)  

我们发现，iOS 和 Android 都是 input 的内容会偏上一点点，针对 iOS 端的截图进一步放大然后 ps 测量发现 (mac 下截图所以是两倍)：  

左侧 Text: 外框高度 80px, 字体 26px, 上边距 27px, 下边距 27px  
右侧 TextInput: 外框高度 80px, 字体 26px, 上边距 28px, 下边距 26px  

明显是 Text 的锅...等等，来个奇数试试，将外框高度设置为 40.5, 测量后发现：  

左侧 Text: 外框高度 81px, 字体 26px, 上边距 26px, 下边距 29px  
右侧 TextInput: 外框高度 81px, 字体 26px, 上边距 28px, 下边距 27px  

这突然间 TextInput 做的要相对好一些了...还有字体，应该 28px 才对嘛，为什么要比设定的 14 小 1, 在尝试了几个其他数字发现，这个数值所对应显示的真实像素，在接近 8(16px) 的时候是准确的，随着数字的增大误差会越来越大：  

2->5px  
14->26px  
20->37px  
25->46px  

当然肉眼辨识度可能有问题，权当娱乐了吧 >_<  

然后再去看看 Text 和 TextInput 本身，分别给两者设置 border:  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-27-0ddd15617d.jpg)  

我们发现，好像貌似居中了呢？难道 TextInput 默认有个 border? 赶紧把手动给 TextInput 设置的 border 去掉，我们发现依然是原来的显示效果，回头想想 web 端的 input 才恍然大悟，它一定是存在一个默认的 border 的。  

然后在尝试将 TextInput 的 borderWidth 设置为 0 后发现并没有任何作用，所以只好给左侧的 Text 设置一个透明 border 了，问题至此已经解决：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-27-4cf731d14b.jpg)  

