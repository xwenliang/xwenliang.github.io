---
layout: post
title: 做个 chrome 插件吧
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2016-03-07 18:26:02+0800
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


很久没有写点东西了，说来惭愧。团队上有很多杂事要处理，尤其现在组里人多了起来，需要想的事情有很多，想要做的也很多，每天会议也很多...真像某位前辈说的，该适当控制下自己写代码的欲望了，但代码写少了会感觉很心慌...总觉得自己要被时代遗弃了...  

最近终于抽空把这个需求做了：给有道词典开发一个能一键加入单词本的浏览器插件。  

我尝试了好几个官方提供的插件，要么是有 bug 用不了，要么就必须开启划词翻译，然后点翻译上的打开详情，进入详情后在点击一个加入单词本的按钮才能操作成功...  

我是极其不愿意开启划词翻译的，觉得这样像走马观花，后面碰到了还是记不住不认识，并且会对翻译工具产生依赖。  

理想中的插件应该是这样的：在浏览器复制要添加的单词，打开该插件粘贴，保存即可同步到有道单词本。  

这样每天晚上睡前看几眼今天记录的单词，回想一下当时的语境，应该会对这些单词加深印象吧。然后添加的时候最好查重，有重复提交的给些提示啥的，方便再次加强记忆。  

说干就干，查了一些资料和[官方文档](https://developer.chrome.com/extensions/devguide)后发现也没啥难的，差不多分那么几大块：  

1.background, 类似于后台的代码，只在浏览器启动的时候执行一次，可直接跨域请求  
2.content, 会直接插入到当前页面执行的代码，可以通过 run_at 设置是在页面加载前还是加载后执行，文档中都有说明  
3.popup, 就是点击浏览器插件的时候弹出来的小窗口  

知道了这些，后面就是模拟有道登录，然后调用有道添加单词本的接口就可以了，想当然的选择了在 background 中去模拟登录。  

然后发现，即使是通过浏览器最新的 [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), 虽然请求能正常收发，但仍然无法获取到返回头的 Set-Cookie 字段。取不到 cookie 自然就连模拟登录都做不了了。  

仔细想想也是合理的，如果能通过 fetch 获取到 Set-Cookie 中的值，那么 httpOnly 也就形同虚设了...所以在浏览器中获取 cookie 只有一条路：document.cookie  

然后发现在 popup 中通过设置 fetch 的 credentials 可以实现将返回的 cookie 设置到相对应的域下。这样就成功获得了有道的登录凭证...感觉利用这个特性还可以搞搞其他有意思的东西啊，比如一键登录所有账号啥的...  

目前已经实现的功能仅仅是登录有道和添加单词到有道单词本，其他像查重提示，添加自定义 tag 啥的都还没搞，目前是够我用了，感兴趣的同学可以看[这里](https://github.com/xwenliang/zoo-vocab)  

我大 google 发布浏览器插件要付个一次性的 $5, 等我的 visa 双币卡下来了再发布到应用商店吧...  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-27-10ba78cf0b.jpg)  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-27-378f1e7f34.jpg)  

