// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

Vue.config.productionTip = false


const test = 'abcd';
alert(test.includes('a')); //IE9报错：SCRIPT438: 对象不支持“includes”属性或方法
/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
