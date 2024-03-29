import Data from './../data/Data'
import LifeItem, { LifeItemDataType } from './LifeItem'

/*
传参问题不能用apply解决，避免箭头函数产生的this指向错误问题
生命周期函数暂行方案
通过Map实现，可实现对应的顺序
基本周期函数
created
beforeLoad
actived
inactived
loaded
loadFail
beforeUpdate
updated
updateFail
beforeReset
reseted
beforeDestroy
destroyed
*/

export interface LifeDataInitOption {
  [prop: string]: LifeItemDataType | LifeItemDataType[]
}

class LifeData extends Data {
  static $name = 'LifeData'
  data: Record<PropertyKey, LifeItem>
  constructor(initOption?: LifeDataInitOption) {
    super()
    this.data = {}
    if (initOption) {
      this.$initData(initOption)
    }
  }
  /**
   * 加载生命周期状态列表
   * @param {object} [initOption] 生命周期参数
   * @param {boolean} [reset = true] 是否重置
   */
  $initData(initOption: LifeDataInitOption = {}, reset = true) {
    if (reset) {
      this.reset()
    }
    for (const n in initOption) {
      const item = initOption[n]
      this.on(n, item)
    }
  }
  /**
   * 创建对应的生命周期对象:存储
   * @param {string} name 生命周期名称
   * @param {boolean} [auto = true] 不存在时自动设置
   */
  build(name: string, auto = true) {
    if (!this.data[name] && auto) {
      this.data[name] = new LifeItem({
        name: name
      })
    }
  }
  /**
   * 获取对应生命周期对象
   * @param {string} name 生命周期名称
   * @param {boolean} [auto = true] 不存在时自动设置
   * @returns {LifeItem}
   */
  get(name: string, auto?: boolean) {
    this.build(name, auto)
    return this.data[name]
  }
  /**
   * 设置生命周期回调
   * @param {string} name 生命周期名称
   * @param {*} data LifeItem参数
   * @returns {string | string} id/idList
   */
  on(name: string, ...args: Parameters<LifeItem['build']>) {
    const funcItem = this.get(name, true)
    return funcItem.build(...args)
  }
  /**
   * 触发生命周期指定id函数
   * @param {string} name 生命周期
   * @param {string} id 指定ID
   * @param  {...any} args 参数
   */
  emit(name: string, ...args: Parameters<LifeItem['emit']>) {
    const funcItem = this.get(name, true)
    funcItem.emit(...args)
  }
  /**
   * 触发生命周期
   * @param {string} name 生命周期
   * @param  {...any} args 参数
   */
  trigger(name: string, ...args: Parameters<LifeItem['trigger']>) {
    const funcItem = this.get(name, true)
    funcItem.trigger(...args)
  }
  /**
   * 删除生命周期指定函数
   * @param {string} name 生命周期
   * @param {string} id 指定ID
   * @returns {boolean}
   */
  off(name: string, ...args: Parameters<LifeItem['off']>): boolean {
    const funcItem = this.get(name, false)
    if (funcItem) {
      return funcItem.off(...args)
    } else {
      return false
    }
  }
  /**
   * 清除生命周期
   * @param {string} name 生命周期
   */
  clear(name: string) {
    const funcItem = this.get(name, false)
    if (funcItem) {
      funcItem.clear()
    }
  }
  /**
   * 重置
   */
  reset() {
    for (const name in this.data) {
      this.clear(name)
    }
  }
  /**
   * 销毁
   */
  destroy() {
    this.reset()
    this.data = {}
  }
}

export default LifeData