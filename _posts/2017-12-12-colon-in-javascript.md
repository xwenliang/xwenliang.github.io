---
layout: post
title: javascript 中的冒号
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2017-12-12 19:29:56+0800
sync_link: https://xwenliang.cn/p/5a2fbdb45488a2d34c000002
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最近小伙伴又遇到了问题，告诉我以下代码会报错：  
  
```javascript
['m', 'd', 'h', 'n', 's'].forEach(v => {
    console.log(v);
}
//TypeError: Cannot read property 'forEach' of undefined
```
  
但是这么写就不会：  
  
```javascript
const arr = ['m', 'd', 'h', 'n', 's'];
arr.forEach(v => {
    console.log(v);
}
```

看起来这两段代码都丝毫没有问题，当时就想会不会是编译工具的问题，就让小伙伴去检查编译后的代码了。  

数分钟过后，小伙伴告诉我是上面的语句没有加分号导致的，突然想起来曾经这是个很经典的「无限分号党」用来说服别人的案例：  

```javascript
const seconds = new Date().getSeconds()
['m', 'd', 'h', 'n', 's'].forEach(v => {
    console.log(v);
}
```

这样后面的数组就变成了上面 `new Date().getSeconds()` 返回对象的取值运算了，然后返回了 undefined, 所以导致了之前的报错。  

然后又跟小伙伴讨论，用数组去取对象的值会发生什么呢？结果又发现了其他的问题，下面代码直接贴到控制台会报错：  

```javascript
{a: 1, b: 2}['a', 'b']
//Uncaught SyntaxError: Unexpected token :
```

而这么写就没问题：  

```javascript
{a: 1}['a', 'b']
//控制台输出：["a", "b"]
```

上面的代码好理解，{} 被解析成了代码块，并没有解析为对象，那下面为什么没有报错呢？如果是代码块的话 `a:1` 会是个什么东西呢？  

搜查了一番，发现 javascrit 中的冒号大概有以下四种用法：  

1.创建对象  
`const cat = {name: 'xiaohua', age: 2}`

2.用作标记声明 [labeled statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label)  

```javascript
let i;
loop:
for (i = 0; i < 3; i++) {
    if(i === 1){
        continue loop;
    }
    console.log(i);
}
//0
//2
```  

3.用于switch case代码块中  

4.用在三元运算符中  

所以这里的 `a:1` 应该是被用作了标记声明，虽然这种用法当用于标记函数声明的时候，在严格模式下会报错，但也有一些「奇妙」的用处，比如在子循环中跳过父循环的某次循环：  

```javascript
//代码摘抄自MDN官网

var i, j;

loop1:
for (i = 0; i < 3; i++) {      //The first for statement is labeled "loop1"
   loop2:
   for (j = 0; j < 3; j++) {   //The second for statement is labeled "loop2"
      if (i === 1 && j === 1) {
         continue loop1;
      }
      console.log('i = ' + i + ', j = ' + j);
   }
}

// Output is:
//   "i = 0, j = 0"
//   "i = 0, j = 1"
//   "i = 0, j = 2"
//   "i = 1, j = 0"
//   "i = 2, j = 0"
//   "i = 2, j = 1"
//   "i = 2, j = 2"
// Notice how it skips both "i = 1, j = 1" and "i = 1, j = 2"
```

这个问题解决后，再回到我们之前的问题「用数组去取对象的值会发生什么」，查了很多资料也没有找到关于这方面详细的解释，最终我和我的小伙伴「猜测」是方括号中直接执行了逗号运算，拿到最终结果后再去取前面对象中的值：  

```javascript
const a = {a: 1, b: 2};
console.log(a['x', 'y', 'z', 'a']);
//1
const b = {a: 1, b: 2};
console.log(b['x', 'y', 'z', 'b']);
//2
```

