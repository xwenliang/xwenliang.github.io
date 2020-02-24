// zooble@2020-02-25

const info = wx.info = wx.getSystemInfoSync();
// events
wx.touchStartFns = [];
wx.touchMoveFns = [];
wx.touchEndFns = [];
wx.touchCancelFns = [];
wx.onTouchStart = function(fn){
    wx.touchStartFns.push(fn);
};
wx.onTouchMove = function(fn){
    wx.touchMoveFns.push(fn);
};
wx.onTouchEnd = function(fn){
    wx.touchEndFns.push(fn);
};
wx.onTouchCancel = function(fn){
    wx.touchCancelFns.push(fn);
};

Page({
    data: {
        canvasWidth: info.windowWidth,
        canvasHeight: info.windowHeight
    },
    onLoad(){
        // get canvas
        wx.createSelectorQuery()
        .select('#canvas')
        .fields({
            node: true,
            size: true,
        })
        .exec(this.init.bind(this));
    },
    onUnload(){
        if(wx.game){
            wx.game.pause();
        }
    },
    init(res){
        const canvas = res[0].node;
        wx.canvas = canvas;
        wx.canvas.width = wx.canvas.innerWidth = this.data.canvasWidth;
        wx.canvas.height = wx.canvas.innerHeight = this.data.canvasHeight;
        wx.createCanvas = function(){
            return canvas;
        };
        wx.Audio = function(){
            return wx.createInnerAudioContext();
        };
        wx.Image = function(){
            // js/libs/weapp-adapter.js#L787 改写，此处其实无效
            return wx.canvas.createImage();
        };
        if(wx.game){
            return wx.game.resume();
        }
        // load game
        wx.game = require('./mini-game-quickstart/game').default;
    },
    touchStart(event){
        wx.touchStartFns.reduce((calc, el) => {
            el(event);
        }, null)
    },
    touchMove(event){
        wx.touchMoveFns.reduce((calc, el) => {
            el(event);
        }, null)
    },
    touchEnd(event){
        wx.touchEndFns.reduce((calc, el) => {
            el(event);
        }, null)
    },
    touchCancel(event){
        wx.touchCancelFns.reduce((calc, el) => {
            el(event);
        }, null)
    }
});