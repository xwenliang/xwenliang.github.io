/*----------------------------------------------------
 原生js焦点图 修正chrom/FF下最小化或切换tab的bug
 @ Author 	zooble
 @ Email 	wenliang.web@gmail.com
 @ Time 	2014-1-8

 -----------------------------------------------------*/
function MyBox(cfg){
	//设置默认参数
	var opt = this.opt = {
		containerId: 'myFocus',
		cellUlId: 'pic',
		btnUlId: 'num_ul',
		cellTagName: 'li',
		interval: 2000,
		requestId: null
	};
	//将cfg中的参数合并进来
	for(var i in cfg){
		opt[i] = cfg[i];
	};
};

MyBox.prototype = {
	init: function(){
		var self = this;
		var opt = self.opt;
		opt.container = self.g(opt.containerId);
		opt.cellUl = self.g(opt.cellUlId);
		opt.cells = opt.cellUl.getElementsByTagName(opt.cellTagName);
		opt.cellWidth = parseInt(self.getStyle(opt.cells[0], 'width'));
		opt.cellLen = opt.cells.length;
		opt.btnUl = self.g(opt.btnUlId);
		opt.btns = opt.btnUl.getElementsByTagName(opt.cellTagName);
		opt.ii = 0;//滚动索引
		opt.cellUl.innerHTML += opt.cellUl.innerHTML;
		opt.cellUl.style.width = opt.cellWidth * opt.cellLen * 2 + 'px';
		self.scrollCtrl(opt.cellUl, opt.interval);
	},
	g: function(id){
		return document.getElementById(id);
	},
	//获取样式 惰性判断
	getStyle: function(obj, attr){
		var self = this;
		obj.currentStyle
		? self.getStyle = function(obj, attr){
			return obj.currentStyle[attr];
		}
		: self.getStyle = function(obj, attr){
			return window.getComputedStyle(obj, false)[attr];
		};
		return self.getStyle(obj, attr);
	},
	each: function(obj, fn){
		var len = obj.length;
		if(!len){
			return;
		}
		for(var i=0;i<len;i++){
			fn(i, obj[i]);
		}
	},
	//滚动控制含树
	scrollCtrl: function(obj, interval){
		var opt = this.opt;
		var getStyle = this.getStyle;
		var each = this.each;
		var perWidth = opt.cellWidth;
		var len = opt.cellLen;
		var btns = opt.btns;
		var tar = -perWidth * opt.ii;
		var attr = 'left';
		var _interval = interval;

		function animate(){
			var current = parseInt(getStyle(obj, attr));
			var speed = (tar - current)/6;
			speed = speed > 0 ? Math.ceil(speed) : Math.floor(speed);
			obj.style[attr] = current + speed + 'px';
			opt.startime = opt.startime || +new Date();
			if(+new Date() - opt.startime > _interval){
				opt.startime = null;
				opt.ii++;
				if(opt.ii > len){
					opt.ii = 0;
					obj.style[attr] = 0;
					_interval = 0;
				}
				else{
					_interval = interval;
				}

				tar = -perWidth * opt.ii;
				each(btns, function(i, btn){
					btn.className = '';
				});
				btns[opt.ii%len].className = 'active';
			}
			opt.requestId = window.requestAF(animate);

		};
		window.requestAF = (function(){
			return window.requestAnimationFrame
				|| window.webkitRequestAnimationFrame
				|| window.mozRequestAnimationFrame
				|| window.oRequestAnimationFrame
				|| function(callback){
						window.setTimeout(callback, 1000 / 60);//不支持则用定时器设置帧数为60fps 显示器刷新频率为60HZ
					};
		})();
		window.cancelAF = (function(){
			return window.cancelAnimationFrame
				|| window.webkitCancelAnimationFrame
				|| window.mozCancelAnimationFrame
				|| window.oCancelAnimationFrame
				|| function(id){
						window.clearTimeout(id);
					};
		})();
		animate();
	},
	constructor: MyBox
};

