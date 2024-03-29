/* eslint-disable @typescript-eslint/no-explicit-any */
import { upperCaseFirstChar } from 'complex-utils'
import SimpleData, { SimpleDataInitOption } from './SimpleData'
import LifeData, { LifeDataInitOption } from './../lib/LifeData'
import { formatInitOption } from '../utils'

export interface DefaultDataInitOption<P extends undefined | DefaultData<any> = undefined> extends SimpleDataInitOption<P> {
  life?: LifeDataInitOption
}

class DefaultData<P extends undefined | DefaultData<any> = undefined> extends SimpleData<P> {
  static $name = 'DefaultData'
  $life: LifeData;
  constructor(initOption: DefaultDataInitOption<P>) {
    initOption = formatInitOption(initOption)
    super(initOption)
    this.$life = new LifeData(initOption.life)
    this.$triggerCreateLife('DefaultData', 'beforeCreate', initOption)
    this.$triggerCreateLife('DefaultData', 'created', initOption)
  }
  /**
   * 触发创造生命周期
   * @param {string} env 当前调用对象名称
   * @param {string} lifeName 生命周期
   * @param  {*[]} args 参数
   */
  $triggerCreateLife(env: string, lifeName: string, ...args: any[]) {
    if (!env) {
      this.$exportMsg('$triggerCreate函数需要传递env参数')
    }
    const name = this.$getConstructorName()
    if (env === name) {
      // 当前环境是对应触发的类的环境时，触发独立的创建生命周期
      this.$triggerLife(lifeName, this, ...args)
    }
    // 触发带类名称的创建生命周期
    this.$triggerLife(env + upperCaseFirstChar(lifeName), this, ...args)
  }
  /**
   * 设置生命周期回调函数
   * @param {string} name 对应生命周期
   * @param {*} data 回调对象
   * @returns {string | string} id/idList
   */
  $onLife(...args: Parameters<LifeData['on']>) {
    return this.$life.on(...args)
  }
  /**
   * 触发生命周期指定id函数
   * @param {string} name 生命周期
   * @param {string} id 指定ID
   * @param  {...any} args 参数
   */
  $emitLife(...args: Parameters<LifeData['emit']>) {
    this.$life.emit(...args)
  }
  /**
   * 删除生命周期指定函数
   * @param {string} name 生命周期
   * @param {string} id 指定ID
   * @returns {boolean}
   */
  $offLife(...args: Parameters<LifeData['off']>): boolean {
    return this.$life.off(...args)
  }
  /**
   * 触发生命周期
   * @param {string} name 生命周期
   * @param  {...any} args 参数
   */
  $triggerLife(...args: Parameters<LifeData['trigger']>) {
    this.$life.trigger(...args)
  }
  /**
   * 清除生命周期
   * @param {string} name 生命周期
   */
  $clearLife(...args: Parameters<LifeData['clear']>) {
    this.$life.clear(...args)
  }
  /**
   * 生命周期重置
   */
  $resetLife() {
    this.$life.reset()
  }
  /**
   * 生命周期销毁
   */
  $destroyLife() {
    this.$life.destroy()
  }
}

export default DefaultData
