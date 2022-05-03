---
layout: post
title: React 服务端渲染
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2018-03-06 12:10:52+0800
sync_link: https://xwenliang.cn/p/5a9e145309d7cf117a000001
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


写了这么多年博客，本来就没几篇，被百度收录的更是少之又少，可能因为之前大部分时间都是为了追求页面效果而使用了前端模板，导致百度蜘蛛过来的时候没有东西可爬吧。所以最近打算搞成前端+服务端共同渲染，实现**用户手点页面的时候在前端跳转，直接请求页面则由服务端直接返回拼装好的页面**。本篇主要记录使用 react 服务端渲染来实现这个需求所以到的几个问题，所使用的 react 版本为 `15.5.4`  

1.首先遇到的问题是，node 端无法识别 jsx 语法，正好想用 es6 重写整个项目，所以使用了 babel-node 来执行 node 端项目，它可以像前端打包那样配置 .babelrc 指定文件的编译方式然后编译并运行。  

2.然后想要在服务端渲染，就必须在服务端运行 react 组件，传入 props 并执行 react 组件的 render 方法来生成拼装好数据的 html 节点，react 提供了 ReactDOMServer.renderToString 方法来实现该功能，该方法会在 node 端执行组件 `componentDidMount` 生命周期之前的所有方法，也就是 `constructor`、`componentWillMount`、`render`, 所以这三个方法中不能有任何的浏览器 API 调用，比如 `XMLHttpRequest`、`window` 等。  

3.当服务端根据 react 组件生成的页面节点到达浏览器后，由于该 react 组件还会完整的在浏览器再执行一遍，所以 react 内部执行了 diff 机制，如果前端初始化该组件传入的 props 和服务端一致，则直接跳过 `constructor`、`componentWillMount`、`render` 这三步，执行生命周期后续的 `componentDidMount` 等方法，来实现用户在浏览器里和网页的交互。如果传入的 props 不一致，或者两次渲染组件内部结构不一致，则会有一个 diff 的 warning 提示你，前后端渲染结果不一致，将会失去服务端渲染带来的优势：  

> Warning: React attempted to reuse markup in a container but the checksum was invalid. This generally means that you are using server rendering and the markup generated on the server was not what the client was expecting. React injected new markup to compensate which works but you have lost many of the benefits of server rendering. Instead, figure out why the markup being generated is different on the client or server  

即使只多了一个空格，都会有这个 warning, 当然 product 环境该提示是被屏蔽掉的，然而肯定会带来额外的开销，比如多一次重绘，以及重绘带来的页面抖动。好在 React@16 改进了这个问题，去掉了暴力的 checksum 和 warning, 尽量使用已经存在的 DOM  

4.为了让 react 组件更好的在端运行，要尽量把 react 组件写成前后通用，也就是 `constructor`、`componentWillMount`、`render` 无 DOM/BOM 调用且整个组件无 css 的引用。然后前端调用时再对该组件进行一次包装，引入 css, 传入 data. 为了前后端传入数据一致，服务端在往页面注入 react 组件生成的 html 字符串之前还要同时注入所使用的 data  

举一个 page 的例子(只是示意，并不完整)，它由5部分组成：  

a) server.page.js 服务端监听路由：  

```javascript
import ReactDOMServer from 'react-dom/server';
import Page from './client.page.common';
app.get('/page', (req, res) => {
    const user = {
        username: '小花',
        age: '12'
    };
    res.render('server.page.html', {
        username: user.username,
        age: user.age,
        html: ReactDOMServer.renderToString(
            <Page
                username={user.username}
                age={user.age}
            />
        )
    });
});
```

b) server.page.html 模板：  

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
</head>
<script>
    var serverData = {
        username: <%- username %>,
        age: <%- age %>
    };
</script>
<body>
    <div id="page"><%- html %></div>
    <!--此处只是示意，一般是由webpack编译引入文件-->
    <script src="./client.page.js"></script>
</body>
</html>
```

c) client.page.js 前端组件调用逻辑：  

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import './client.page.css';
import Page from './client.page.common.js';

ReactDOM.render(<Page
    username={serverData.username}
    age={serverData.age}
/>, document.getElementById('page'));
```

d) client.page.css 前端组件样式：  

```css
body{
    background: red;
}
```

e) client.page.common.js react通用组件：  

```javascript
import React from 'react';
export default class Page extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            username: '',
            age: '',
            ...props
        };
    }
    render(){
        return (
            <div>
                我的名字叫{this.state.username},
                我今年{this.state.age}岁了。
            </div>
        );
    }
}
```

可以看得出来，这么做除了有利于 SEO 和解决 SPA 首页白屏外，还有一个好处就是可以在改动非常小的情况下异步加载一些不重要的模块，比如要在 page 页面添加一个评论模块，但是它又没那么重要，不想影响首页等待时间，可以在 componentDidMount 中 ajax 请求后端接口然后渲染相应的评论模块，做到了组件和页面间高度的复用和解耦。  

要实现点击页面按钮的时候在前端跳转渲染，还有几个问题要解决：  

1.需要把所有页面的 css 和 js 资源全部加载进来，不一定要同步，可以首屏结束后异步。  
2.需要把服务端注入页面的数据再做成一个接口返回，因为在前端跳转到该路由后需要去服务端获取对应数据。  
3.还要在服务端监听所有的路由，因为用户可能会直接刷新在前端跳转后的页面，也就是说只能用 `pushState` 而不能用 `hash` 来实现。  

这样用户在页面上点击按钮要进行跳转时，启动该路由对应的组件并 ajax 请求接口数据进行渲染。当用户点击刷新按钮的时候（也就是直接请求该页面的场景），后端拿到地址匹配到相应的通用 react 组件进行渲染，然后直接返回渲染好的 html 字符串，这样就完成了本文一开始所提到的两个需求。  

