/* eslint-disable @typescript-eslint/no-explicit-any */
import { deepClone, getNum } from 'complex-utils'
import config from '../../config'
import BaseData from '../data/BaseData'
import { formatInitOption } from '../utils'
import DefaultData, { DefaultDataInitOption } from './../data/DefaultData'
import AttributesData, { AttributesDataInitOption } from './AttributesData'

type sizeObjectType = {
  change?: boolean,
  current: number,
  list?: string[]
}

type sizeType = boolean | number | sizeObjectType
type jumperType = boolean

export interface PaginationDataInitOptionObject extends DefaultDataInitOption {
  size?: sizeType
  jumper?: jumperType
  local?: AttributesDataInitOption
}

export type PaginationDataInitOption = undefined | true | PaginationDataInitOptionObject

export type pageProp = 'current' | 'total' | 'num' | 'size'

export type pageData = Partial<Record<pageProp, number>>

class PaginationData extends DefaultData {
  static $name = 'PaginationData'
  current: number
  total: number
  num: number
  size: {
    change: boolean,
    current: number,
    list: string[]
  }
  jumper: {
    change: boolean
  }
  $local: AttributesData
  constructor(initOption?: PaginationDataInitOption) {
    initOption = formatInitOption(initOption) as PaginationDataInitOptionObject
    super(initOption)
    this.$triggerCreateLife('PaginationData', 'beforeCreate', initOption)
    this.current = 1
    this.total = 1
    this.num = 0
    if (!initOption.size) {
      this.size = {
        change: true,
        current: config.PaginationData.size.current,
        list: deepClone(config.PaginationData.size.list)
      }
    } else {
      switch (typeof initOption.size) {
        case 'number':
          this.size = {
            change: true,
            current: initOption.size,
            list: [initOption.size.toString()]
          }
          break;
        case 'boolean':
          this.size = {
            change: initOption.size,
            current: config.PaginationData.size.current,
            list: deepClone(config.PaginationData.size.list)
          }
          break;
        default:
          this.size = {
            change: true,
            current: initOption.size.current,
            list: initOption.size.list ? initOption.size.list : [initOption.size.current.toString()]
          }
          break;
      }
    }
    this.jumper = {
      change: !!initOption.jumper
    }
    this.$local = new AttributesData(initOption.local)
    this.$triggerCreateLife('PaginationData', 'created')
  }
  /**
   * 获取UI设置项
   * @returns {object}
   */
  getLocalOption() {
    return this.$local
  }
  /**
   * 设置总数
   * @param {number} num 总数
   */
  setNum(num: number, unCountCurrent?: boolean, unTriggerCurrentLife?: boolean) {
    this.num = num < 0 ? 0 : num
    this.$autoCountTotal(unCountCurrent, unTriggerCurrentLife)
    this.$syncData(true, 'setNum')
  }
  /**
   * 获取总数
   */
  getNum(): number {
    return this.num
  }
  /**
   * 计算页码相关数据
   */
  $autoCountTotal(unCountCurrent?: boolean, unTriggerCurrentLife?: boolean) {
    const total = getNum(this.getNum() / this.getSize(), 'ceil', 0)
    this.total = total < 1 ? 1 : total
    if (!unCountCurrent && this.getCurrent() > this.total) {
      this.setCurrent(this.total, unTriggerCurrentLife)
    }
    this.$syncData(true, '$autoCountTotal')
  }
  /**
   * 获取总页码
   * @returns {number}
   */
  getTotal(): number {
    return this.total
  }
  /**
   * 设置当前页
   * @param {number} current 当前页
   */
  setCurrent(current: number, unTriggerCurrentLife?: boolean) {
    const total = this.getTotal()
    if (current < 1) {
      current = 1
    } else if (current > total) {
      current = total
    }
    if (this.current !== current) {
      this.current = current
      this.$syncData(true, 'setCurrent')
      if (!unTriggerCurrentLife) {
        this.$triggerLife('change', this, 'current', current)
      }
    }
  }
  /**
   * 获取当前页
   * @returns {number}
   */
  getCurrent() {
    return this.current
  }
  /**
   * 更改页面条数
   * @param {number} size size参数
   */
  setSize(size: number, unCountCurrent?: boolean, unTriggerSizeLife?: boolean) {
    this.size.current = size
    this.$autoCountTotal(unCountCurrent, true)
    if (!unTriggerSizeLife) {
      this.$triggerLife('change', this, 'size', {
        size: size,
        page: this.getCurrent()
      })
    }
    this.$syncData(true, 'setSize')
  }
  /**
   * 获取当前size
   * @returns {number}
   */
  getSize() {
    return this.size.current
  }
  /**
   * 更改页面条数和页码
   * @param {number} size size参数
   * @param {number} page page参数
   */
  setCurrentAndSize(data: { current: number, size: number }, unTriggerCurrentAndSizeLife?: boolean) {
    this.setSize(data.size, true)
    this.setCurrent(data.current)
    if (!unTriggerCurrentAndSizeLife) {
      this.$triggerLife('change', this, 'currentAndSize', data)
    }
  }
  getData(prop: pageProp = 'current') {
    let data
    if (prop === 'current') {
      data = this.getCurrent()
    } else if (prop === 'size') {
      data = this.getSize()
    } else if (prop === 'num') {
      data = this.getNum()
    } else if (prop === 'total') {
      data = this.getTotal()
    }
    return data
  }
  getDataObject(propList: pageProp[] = ['current', 'size']) {
    const data: pageData = {}
    for (const prop in propList) {
      data[prop as pageProp] = this.getData(prop as pageProp)
    }
    return data
  }
  /**
   * 重置
   */
  reset() {
    this.setNum(0, true)
    this.setCurrent(1)
  }
  /**
   * 根据分页器从list中获取对应的数组
   * @param {*[]} list 需要解析的数组
   * @param {boolean} [unOrigin] 是否是当前分页器的数据源，为真则不是，此时不对分页器数据做修正
   * @returns {*[]}
   */
  formatList<T>(list: T[], unOrigin?: boolean): T[] {
    if (!unOrigin) {
      this.setNum(list.length)
    }
    let current = this.getCurrent()
    const total = this.getTotal()
    if (!unOrigin && current > total) {
      this.setCurrent(total)
      current = total
    }
    const size = this.getSize()
    const start = (current - 1) * size
    const end = start + size
    return list.slice(start, end)
  }
  /**
   * 模块加载
   * @param {object} target 加载到的目标
   */
  $install(target: BaseData<any>) {
    super.$install(target)
    target.$onLife('beforeReload', {
      id: this.$getId('BeforeReload'),
      data: (instantiater, resetOption) => {
        let pageResetOption = resetOption.page
        if (pageResetOption) {
          if (pageResetOption === true) {
            pageResetOption = {
              prop: 'page',
              data: 1,
              untriggerLife: true
            }
          }
          if (pageResetOption.untriggerLife === undefined) {
            pageResetOption.untriggerLife = true
          }
          if (pageResetOption.prop === 'page') {
            this.setCurrent(pageResetOption.data, pageResetOption.untriggerLife)
          } else if (pageResetOption.prop === 'size') {
            this.setSize(pageResetOption.data, pageResetOption.untriggerLife)
          } else if (pageResetOption.prop === 'currentAndSize') {
            this.setCurrentAndSize(pageResetOption.data, pageResetOption.untriggerLife)
          }
        }
      }
    })
    // target.$onLife('reseted', {
    //   id: this.$getId('Reseted'),
    //   data: (instantiater, resetOption) => {
    //     if (target.$parseResetOption(resetOption, 'pagination') !== false) {
    //       this.reset()
    //     }
    //   }
    // })
    this.$onLife('change', {
      id: target.$getId('PaginationChange'),
      data: (instantiater, prop, current) => {
        target.$triggerLife('paginationChange', instantiater, prop, current)
      }
    })
  }
  /**
   * 模块卸载
   * @param {object} target 卸载到的目标
   */
  $uninstall(target: BaseData<any>) {
    super.$uninstall(target)
    target.$offLife('beforeReload', this.$getId('BeforeReload'))
    // target.$offLife('reseted', this.$getId('Reseted'))
    this.$offLife('change', target.$getId('PaginationChange'))
  }
  $reset(option?: boolean) {
    if (option !== false) {
      this.reset()
    }
  }
  $destroy(option?: boolean) {
    if (option !== false) {
      this.$reset(option)
    }
  }
}

export default PaginationData
