---
layout: post
title: querystring 的坑
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-10-13 18:50:32+0800
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


记得上次博客改版的时候遇到过一个问题，感觉数据从前端 post 到服务端后发生了不正常的改变，当时也没有多想，写了几行 hack 解决了。幸亏当时留下了大量的注释，否则今天再看见那段 hack 肯定摸不着头脑：  
  
```javascript
req.body = querystring.parse(postData.join(''));
postData = null;
/**
 * 此处有坑:
 * 1.若前端传过来的value是个数组，则key会加'[]'后缀
 *   如，前端post过来的data是{arr: [1,2,3]}，则实际接收时，key是'arr[]'
 * 2.若传过来的数组中只有一个元素，实际接收到的value是这个元素
 *   如，前端post过来的data是{arr: [1]}，则实际接收时，value是1
 */
for(var i in req.body){
	// 命中1
	if(/^.+\[\]$/.test(i)){
		// 命中2
		if(req.body[i].constructor != Array){
			req.body[i] = [req.body[i]];
		}
		req.body[i.replace('[]', '')] = req.body[i];
		delete req.body[i];
	}
}
```

现在再看看这段代码，绝对是「基于巧合的编程」的典范啊，完全不知道 json 的序列化，如果接收的数据碰上是多个对象组成的数组或者多维数组，绝对挂的体无完肤啊，好在前端也是自己写，没有传递更复杂的数据，「恰好」没有发生问题。  

但即使是传递的数据被序列化了，好像也不符合大多数前端库封装的 ajax 中对 json 序列化的规矩啊，如 jQuery 和 Zepto, 他们分别都是使用了 $.param 这个方法对传递的数据做处理：  

```javascript
//示例代码
var $ = require('jQuery');//或者Zepto
//传递一维对象
var simple = {a: 1, b: 2};
$.param(simple);
//得到
//a=1&b=2

//传递二维或多维
var complex = {
    a: [1, 2, 3],
    b: [
        {
            c: 4,
            d: 5,
            e: 6
        },
        {
            f: 7,
            g: 8,
            h: 9
        }
    ],
    c: {
        d: 10
    }
};
$.param(complex);
//将结果decodeURIComponent之后得到：
//a[]=1&a[]=2&a[]=3&b[0][c]=4&b[0][d]=5&b[0][e]=6&b[1][f]=7&b[1][g]=8&b[1][h]=9&c[d]=10
 ```

上面的结果大致可以看出 json 序列化的规律，其实我对其他语言都能约定俗成的使用同一规则表示惊奇。但回过头看看我大 node:  

```javascript
var querystring = require('querystring');
//传递一维对象序列化后的字符串
var simple = 'a=1&b=2';
querystring.parse(simple);
//得到
//{a: '1', b: '2'}

//传递二维或多维对象序列化后的字符串
var complex = `a[]=1&a[]=2&a[]=3&b[0][c]=4&b[0][d]=5&b[0][e]=6&b[1][f]=7&b[1][g]=8&b[1][h]=9&c[d]=10`;
 
querystring.parse(complex);
// 得到：
// { 
//     'a[]': ['1', '2', '3'],
//     'b[0][c]': '4',
//     'b[0][d]': '5',
//     'b[0][e]': '6',
//     'b[1][f]': '7',
//     'b[1][g]': '8',
//     'b[1][h]': '9',
//     'c[d]': '10'
// }

//并且
querystring.parse('a[]=1');
//得到
//{
//    'a[]': 1
//}
//还有url对象的url.parse(urlStr, true)，
//官网明确说明解析query也使用了querystring.parse
```

虽然说 querystring 可能不是标准的用于反序列化模块，但 url 模块的 parse 函数，官网给出的[文档](https://nodejs.org/api/url.html)上写着如果第二个参数传入 true 的话，最终 url.parse 得出来对象的 query 属性，将是一个解析了 search 的对象，并且是用 querystring 来解析的：  

```javascript
var url = require('url');
url.parse('http://localhost:3000/user?a[]=1&a[]=2&b[]=3#4', true);
// 将得到：
// {
//     protocol: 'http:',
//     slashes: true,
//     auth: null,
//     host: 'localhost:3000',
//     port: '3000',
//     hostname: 'localhost',
//     hash: '#4',
//     search: '?a[]=1&a[]=2&b[]=3',
//     query: { 'a[]': [ '1', '2' ], 'b[]': '3' },
//     pathname: '/user',
//     path: '/user?a[]=1&a[]=2&b[]=3',
//     href: 'http://localhost:3000/user?a[]=1&a[]=2&b[]=3#4'
// }
```

也就是说，只有当前端传过来的数据是一维对象序列化的结果，才能被正确的解出来。所以才有了前面的笑话...  

目前还没有发现 node 的哪个自带模块可以正常的反序列化，第三方的倒是有不少，推荐 [`qs`](https://www.npmjs.com/package/qs)  

测试 node 版本：  
`v0.10.35`  
`v4.0.0`  
`v4.1.1`  

