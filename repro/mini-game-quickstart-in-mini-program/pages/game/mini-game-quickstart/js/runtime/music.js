const Audio = wx.Audio;//zooble

let instance
/**
 * 统一的音效管理器
 */
export default class Music {
  constructor() {
    if ( instance )
      return instance

    instance = this

    this.bgmAudio = new Audio()
    this.bgmAudio.loop = true
    this.bgmAudio.src  = 'pages/game/mini-game-quickstart/audio/bgm.mp3'//zooble

    this.shootAudio     = new Audio()
    this.shootAudio.src = 'pages/game/mini-game-quickstart/audio/bullet.mp3'//zooble

    this.boomAudio     = new Audio()
    this.boomAudio.src = 'pages/game/mini-game-quickstart/audio/boom.mp3'//zooble

    this.playBgm()
  }

  playBgm() {
    this.bgmAudio.play()
  }

  playShoot() {
    // this.shootAudio.currentTime = 0 
    // 开发环境基础库版本 2.10.1, 真机微信版本 7.0.10
    // 开发环境没问题，真机上为只读属性，报 TypeError: Attemped to assign to readonly property
    // 小程序和小游戏文档上都写着只读，但小游戏真机也可以赋值，且有效
    // 如果不用的话遇到两个先后间隔小的播放就只会播放一个
    // 小程序真机可以用 InnerAudioContext.seek 代替
    // 然而小程序开发环境并没有这个API，报 TypeError: this.shootAudio.seek is not a function
    // 所以才有了这段代码
    wx.info.platform === 'devtools' ? (this.shootAudio.currentTime = 0) : this.shootAudio.seek(0)
    this.shootAudio.play()
  }

  playExplosion() {
    // this.boomAudio.currentTime = 0
    wx.info.platform === 'devtools' ? (this.boomAudio.currentTime = 0) : this.boomAudio.seek(0)
    this.boomAudio.play()
  }
}
