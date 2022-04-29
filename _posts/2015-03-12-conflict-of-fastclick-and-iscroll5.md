---
layout: post
title: 当 FastClick 遇上 iScroll5
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-03-12 19:34:38+0800
orig_link: https://xwenliang.cn/p/550179ce043d254915000001
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


之前做了个活动页，具极少部分用户反馈，页面的按钮点击不了，我几乎试遍了同事的所有手机，都没发现这个问题，后来有个同事买了个索尼 z1, 这个问题终于复现了。  

当时有点懵，就是个 a 链接，没有绑定任何事件，怎么可能会不能跳转。但别人家网站的 a 链接都跳转正常啊。仔细想了想，这个 a 链接真的没有绑定任何事件吗？  

回头看了看引入的模块：fastclick, iscroll5, 这些都是会影响到点击事件的存在啊！赶紧写个 demo 试试：  

1. 单独引入 iscroll5, 页面的 a 链接、点击事件全部不可用，看了看文档，iscroll5 是默认阻止页面的点击事件的，将 click 属性设置为 true, 搞定。  

    等等，既然默认阻止页面点击事件，为什么在活动页中绝大部分机型都可以点击呢？(活动页中并未设置 click 属性）那么赶紧去活动页中，在实例化 iscroll5 的时候将 click 设置为 true. 这次新的问题出现了，这个索尼 z1 可以点击了，但是 iPhone5/6 全部变成双击才能点击了...  

2. 为了消除其他组件引发 bug 的可能性，在测试页面只引入 iscroll5 和 fastclick, 并且不设置 iscroll5 的 click 属性，结果发现其他手机都可以点击，唯有索尼 z1 不可点击。然后将 click 属性设置为 true, 索尼 z1 可点，iPhone5/6 双击才可触发...  

至此基本可以确定，部分机型按钮不可点击的问题是由于 fastclick 和 iScroll5 冲突引起的了。至于详细冲突点，以后有空再研究吧。  

