
/*Author zooble@2013-4-12*/
/*原生js焦点图*/
/*------------------------------------*/
/*@param json={"oUl": "pic", "oBtn": "num_ul", "speed": 2000}*/
function MyBox(container, json){
	this.container = document.getElementById(container);
	this.oUl = document.getElementById(json.oUl);
	this.aLi = this.oUl.getElementsByTagName('li');
	this.aBtn = document.getElementById(json.oBtn).getElementsByTagName("li");
	this.nLen = this.aLi.length;//li个数
	this.ii = 0;//当前滚动的位置
	this.speed = json.speed;//滚动速度
	this.auto = null;//自动滚动
	this._init();//初始化
};
MyBox.prototype = {
	_init: function(){
		var _this = this;
		this.oUl.innerHTML += this.oUl.innerHTML;
		this.nWid = parseInt(this._getStyle(this.aLi[0], "width"));
		this.oUl.style.width = this.nWid*this.nLen*2 + "px";
		this.container.onmouseover = function(){
			clearInterval(_this.auto);
		};
		this.container.onmouseout = function(){
			_this._loop();
		};
		this._loop();
		this._btn();
	},
	_getStyle: function(obj, attr){
		if(obj.currentStyle){
			return obj.currentStyle[attr];
		}
		else{
			return getComputedStyle(obj, false)[attr];
		}
	},
	_run: function(obj, attr, tar, fn){
		clearInterval(obj.timer);
		var _speed = 0;
		var _this= this;
		obj.timer = setInterval(function(){
			var _current = parseInt(_this._getStyle(obj, attr));
			if(Math.abs(_current) >= _this.nWid*_this.nLen){
				_this.ii = 0;
				_this.oUl.style.left = 0;
			}
			_speed = (tar - _current)/6;
			_speed = _speed > 0 ? Math.ceil(_speed) : Math.floor(_speed);
			if(_current === tar){
				clearInterval(obj.timer);
			}else{
				obj.style[attr] = _current + _speed + "px";
			}
		},20);
		if(fn)fn();
	},
	_loop: function(){
		var _this = this;
		var _btnIn = 0;
		clearInterval(_this.auto);
		_this.auto = setInterval(function(){
			_this.ii++;
			_btnIn = _this.ii;
			if(_btnIn >= _this.nLen){
				_btnIn = 0;
			}
			for(var i=0;i<_this.aBtn.length;i++){
				_this.aBtn[i].className = "";
			}
			_this.aBtn[_btnIn].className = "active";
			_this._run(_this.oUl, "left", -_this.ii*_this.nWid);
		}, this.speed);
	},
	_btn: function(){
		var _this = this;
		for(var i=0;i<this.aBtn.length;i++){
			this.aBtn[i].index = i;
			this.aBtn[i].onmouseover = function(){
				if(this.index === _this.ii)return false;//防止放到同一张图片上在播放一次
				for(var j=0;j<_this.aBtn.length;j++){
					_this.aBtn[j].className = "";
				}
				this.className = "active";
				_this.ii = this.index;
				_this.oUl.style.left = (1-_this.ii)*_this.nWid + "px";
				if(_this.ii === 0){
					_this.ii = _this.nLen;
					_this.oUl.style.left = (1-_this.ii)*_this.nWid + "px";
					_this._run(_this.oUl, "left", -_this.ii*_this.nWid);
				}
				_this._run(_this.oUl, "left", -_this.ii*_this.nWid);
			};
		}
	},
	constructor: MyBox
};



