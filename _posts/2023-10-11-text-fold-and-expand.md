---
layout: post
title: 限定行数的富文本末尾实现展开收起
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2023-10-11 15:22:13+0800
sync_link: https://xwenliang.cn/p/6522ae4d7e3546092d17e5a9
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


需求背景：希望做一个限定行数的富文本容器，当超过指定行数时，要在末行的尾部追加「展开」展开所有文本，以及展开后追加 「收起」来恢复折叠状态，以下展示几个用例：  
![IMAGE]({{ site.gallery_prefix }}2023-10-11-05e6d44b23.jpg)![IMAGE]({{ site.gallery_prefix }}2023-10-11-f1fb850ece.jpg)![IMAGE]({{ site.gallery_prefix }}2023-10-11-2a83e65716.jpg)  

当不超过指定行数时不做处理：  
![IMAGE]({{ site.gallery_prefix }}2023-10-11-4c41088287.jpg)  

结合以往经验，类似的需求一般是在服务端来做处理，通过字数截断文本，将缩略文本和全部文本放在两个字段里，前端分别渲染就可以了，但是这个需求是要求限定行数，而服务端无法方便的得知用户本地的渲染效果，所以无法计算截断长度  

我们经常在微博看到这个效果，去看看是怎么做的：  
![IMAGE]({{ site.gallery_prefix }}2023-10-11-400baa44bf.jpg)  

可以看到也是在服务端根据字数长度做了截断，同时返回了一个查看全文的按钮链接  

---

下面我们尝试实现这个需求：  

### 为什么纯 css 不能实现，能实现到哪种程度  

如果使用纯 css 来实现，我们可能会想到使用多行溢出的样式来实现限定行数，然后再在尾部追加一个子元素或者直接使用伪元素来实现「展开」「收起」  

这可能还需要一些 js 来辅助实现，如计算行数(判断是否需要展开收起)、事件绑定，在计算行数时又遇到一点问题：

我们想到以容器高度除以行高就可以实现，但是有些场景下可能并没有设置行高，此时获取的行高并不是正常的数值：  

```js
window.getComputedStyle($text)['line-height'];
// normal
```

查阅相关的文档发现 [getClientRects](https://developer.mozilla.org/en-US/docs/Web/API/Element/getClientRects) 可以迂回的获取行数，它的实现原理是获取一个容器中所有的边界矩形的集合，块级元素(block)只有一个，行内元素(inline)有多少行就有多少个：  

> The getClientRects() method of the Element interface returns a collection of DOMRect objects that indicate the bounding rectangles for each CSS border box in a client.
> Most elements only have one border box each, but a multiline inline-level element (such as a multiline <span> element, by default) has a border box around each line.

```js
$text.getClientRects().length;
// 7
```

注意每个 `<br>` 都会产生一个 `Rect`, 但实际显示时它并不会独占一行，所以实际行数要减去 `<br>` 的个数，以下为了简便我们还是采用了高度除以行高的方式来计算高度：  

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title> CSS text fold & expand </title>
    <meta charset="utf-8" />
    <style>
        *{
            margin: 0;
            padding: 0;
        }
        .text{
            position: relative;
            width: 200px;
            background: #fff;
            line-height: 20px;
        }
        .text-fold{
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 5;
        }
        .text-fold::after{
            position: absolute;
            padding: 2px 2px 0 5px;
            bottom: 0;
            right: 10px;
            content: '展开';
            text-decoration: underline;
            background: #fff;
            cursor: pointer;
        }
        .text-all{
            display: block;
        }
        .text-all::after{
            position: static;
            content: '收起';
        }
    </style>
</head>
<body>
    <div class="text">你好你好你好你好你<br>好你好你好你好你好你好<br>你好你好你好你好你好你好你好你好<br>你好你好你好你好你好你好你好你好你好你好你好你好你好你好你好你好你<br>好你好你好<br>你好你好你好你好<br>你好你好你好你好你好<br>你好你你好你好你好你好你好你好你好</div>
    <script>
        (function(){
            const limit = 5;
            const $text = document.querySelector('.text');
            const textComputedStyle = window.getComputedStyle($text);
            if(parseFloat(textComputedStyle['height'])/parseFloat(textComputedStyle['line-height']) > limit){
                $text.classList.add('text-fold');
                $text.addEventListener('click', function(ev){
                    this.classList.toggle('text-all');
                });
            }
        })();
    </script>
</body>
</html>
```

[运行上面的代码](https://xwenliang.github.io/repro/text-fold-and-expand/css.html)，我们发现盖在文本上面的「收起」很多时候会把下面的字截断，并且无法兼容文本有一些复杂背景色的情况  

![IMAGE]({{ site.gallery_prefix }}2023-10-11-99fee9895d.jpg)  


### js 方案的实现思路  

考虑以下问题：  

- 当最后一行文本没有满行时，可以直接放置「展开」，但是可能放置后就会折行了  
- 当最后一行文本满行或者超过限定行数时，需要裁剪文本至刚好能放下「展开」  
- 因为不同的文本在不同的设备有不同的渲染宽度，所以必须是根据真实的渲染宽度来裁剪文本  
    
所以我们需要提前将「展开」拼到文本末尾，来计算整体的渲染宽度，如果超过指定行数，就对文本进行尾部裁剪，直至能够满足行数，过程中我们也发现了一些问题：  

- 计算行数是否超出时，必须要把「展开」提前拼在末尾再计算，如果只是计算了裁剪的字数，然后多裁剪 2 个字再放的话，会导致实际渲染可能还是超出行数了，因为不同的文本在不同的设备下可能有不同的渲染宽度  
- 裁剪文本时要注意文本中含有 `<br>` 标签，要绕过它进行裁剪，并且可能会把两个 `<br>` 标签之间的文本裁光，此时要去掉多余的 `<br>` 标签  
- 因为是递归获取渲染样式，当文本足够多时，该操作会非常耗时  

![IMAGE]({{ site.gallery_prefix }}2023-10-11-64c4e61fc9.jpg)  

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title> JS text fold & expand </title>
    <meta charset="utf-8" />
    <style>
        *{
            margin: 0;
            padding: 0;
        }
        .text{
            position: relative;
            width: 200px;
            background: #fff;
            line-height: 20px;
        }
        .more{
            margin-left: 5px;
            text-decoration: underline;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="text">你好你好你好你好你<br>好你好你好你好你好你好<br>你好你好你好你好你好你好你好你好<br>你好你好你好你好你好你好你好你好你好你好你好你好你好你好你好你好你<br>好你好你好<br>你好你好你好你好<br>你好你好你好你好你好<br>你好你你好你好你好你好你好你好你好</div>
    <script>
        (function(){
            const limit = 5;
            const $text = document.querySelector('.text');
            const originHTML = $text.innerHTML;
            let textComputedStyle = window.getComputedStyle($text);
            let lines = parseFloat(textComputedStyle['height'])/parseFloat(textComputedStyle['line-height']);
            function cropText(){
                let index = 0;
                let lis = [];
                let targetHTML = '';
                const reg = /<[^>]+>/ig;
                while(lines > limit){
                    lis = lis.length ? lis : $text.innerHTML.split(reg);
                    lis[lis.length - 1] = lis[lis.length - 1].slice(0, -1);
                    index += 1;
                    // 删掉被删完的
                    lis = lis.filter(li => li);
                    targetHTML = `${lis.join('<br>')}<span class="js-more more">展开</span>`;
                    $text.innerHTML = targetHTML;
                    textComputedStyle = window.getComputedStyle($text);
                    lines = parseFloat(textComputedStyle['height'])/parseFloat(textComputedStyle['line-height']);
                }
                return targetHTML;
            };
            if(lines > limit){
                const targetHTML = cropText();
                document.addEventListener('click', ev => {
                    if([...ev.target.classList].includes('js-more')){
                        $text.innerHTML = `${originHTML}<span class="js-fold more">收起</span>`;
                    }
                    if([...ev.target.classList].includes('js-fold')){
                        $text.innerHTML = targetHTML;
                    }
                });
            }
        })();
    </script>
</body>
</html>
```

[运行效果](https://xwenliang.github.io/repro/text-fold-and-expand/js.html)  

以上只是实现了带 `<br>` 标签的文本，如果有更复杂的样式和标签还需要进一步处理  

有更优秀方案的小伙伴欢迎来讨论  

