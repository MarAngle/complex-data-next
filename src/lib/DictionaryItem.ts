import $func from 'complex-func'
import { formatInitOption } from '../utils'
import dictionaryFormatOption from './../../dictionaryFormatOption'
import SimpleData, { SimpleDataInitOption } from '../data/SimpleData'
import InterfaceData from './InterfaceData'
import LayoutData, { LayoutDataFormatData, LayoutDataInitOption } from './LayoutData'
import DictionaryList, { DictionaryListInitOption } from './DictionaryList'

type payloadType = { targetData: Record<PropertyKey, unknown>, originData?: Record<PropertyKey, unknown>, type: string, from?: string, depth?: number }

type baseFuncType<RES> = (data: unknown, payload: payloadType) => RES

export interface DictionaryItemModType {
  $children?: true | string,
  [prop: PropertyKey]: any
}

export interface PageData {
  prop: string,
  [prop: PropertyKey]: any
}

export interface DictionaryItemInitOption extends SimpleDataInitOption {
  prop: string,
  label?: string | Record<PropertyKey, string>
  type?: string | Record<PropertyKey, string>
  showProp?: string | Record<PropertyKey, string>
  showType?: string | Record<PropertyKey, string>
  originProp?: string | Record<PropertyKey, string>
  originFrom?: string | string[],
  layout?: LayoutDataInitOption,
  mod?: Record<PropertyKey, unknown>,
  dictionary?: DictionaryListInitOption,
  format?: false | baseFuncType<unknown>
  defaultGetData?: false | baseFuncType<unknown>
  show?: false | baseFuncType<unknown>
  edit?: false | baseFuncType<unknown>
  post?: false | baseFuncType<unknown>
  check?: false | baseFuncType<boolean>
}

export interface DictionaryItemPayload {
  layout?: LayoutDataInitOption
}

export type funcKeys = 'format' | 'defaultGetData' | 'show' | 'edit' | 'post' | 'check'
export type interfaceKeys = 'label' | 'type' | 'showProp' | 'showType' | 'originProp' | 'modType'

const defaultGetData = function (this: DictionaryItem, data: unknown, { type }: payloadType) {
  const showProp = this.$getInterface('showProp', type)
  if (showProp) {
    if (data && $func.getType(data) == 'object') {
      return $func.getProp(data as Record<PropertyKey, unknown>, showProp)
    } else {
      return undefined
    }
  } else {
    return data
  }
}
const defaultCheck = function (data: unknown) {
  return $func.isExist(data)
}

class DictionaryItem extends SimpleData {
  prop: string
  originFrom: string[]
  $dictionary?: DictionaryList
  $interface: {
    label: InterfaceData<string>
    type: InterfaceData<string>
    showProp: InterfaceData<string>
    showType: InterfaceData<string>
    originProp: InterfaceData<string>
    modType: InterfaceData<string>
  }
  format?: false | baseFuncType<unknown>
  defaultGetData?: false | baseFuncType<unknown>
  show?: false | baseFuncType<unknown>
  edit?: false | baseFuncType<unknown>
  post?: false | baseFuncType<unknown>
  check?: false | baseFuncType<boolean>
  $layout!: LayoutData
  $mod: {
    [prop: string]: DictionaryItemModType
  }
  static $name = 'DictionaryItem'
  constructor (initOption: DictionaryItemInitOption, payload: DictionaryItemPayload = {}) {
    initOption = formatInitOption(initOption, null, 'DictionaryItem初始化参数不存在！')
    super(initOption)
    // 加载基本自定义函数
    this.format = initOption.format
    this.defaultGetData = initOption.defaultGetData === undefined ? defaultGetData : initOption.defaultGetData
    this.show = initOption.show === undefined ? this.defaultGetData : initOption.show
    this.edit = initOption.edit === undefined ? this.defaultGetData : initOption.edit
    this.post = initOption.post === undefined ? this.defaultGetData : initOption.post
    this.check = initOption.check === undefined ? defaultCheck : initOption.check
    // 自定义函数加载完成
    const originFromType = $func.getType(initOption.originFrom)
    if (originFromType === 'array') {
      this.originFrom = initOption.originFrom as string[]
    } else if (initOption.originFrom && originFromType === 'string') {
      this.originFrom = [initOption.originFrom as string]
    } else {
      this.originFrom = ['list']
    }
    // 加载接口数据
    // 数据格式判断，暂时判断为存在showProp则自动设置为object，暂时不考虑存在showProp{ prop: '' }情况下对应prop的情况
    let type = initOption.type
    if (!type && initOption.showProp) {
      type = 'object'
    }
    this.$interface = {
      label: new InterfaceData(initOption.label === undefined ? this.$name : initOption.label),
      showProp: new InterfaceData(initOption.showProp),
      type: new InterfaceData(type || 'string'),
      showType: new InterfaceData(initOption.showType),
      // prop/originProp
      originProp: new InterfaceData(initOption.originProp || this.$prop),
      modType: new InterfaceData('list')
    }
    // --- 不存在prop时默认以originProp为主，此时以默认为基准=>prop为单一字段
    if (!this.$prop) {
      this.prop = this.$getInterface('originProp')!
    } else {
      this.prop = this.$prop
    }
    this.$setLayout(initOption.layout, payload.layout)

    this.$mod = {}
    dictionaryFormatOption.format(this, initOption.mod)
  }
  /**
   * 获取接口数据对象
   * @param {string} target 对应的接口名称
   * @returns {InterfaceData}
   */
  $getInterfaceData (target: interfaceKeys) {
    return this.$interface[target]
  }
  /**
   * 获取接口prop数据，不存在对应属性或值则获取默认值
   * @param {string} target 对应的接口名称
   * @param {string} [prop] 属性值
   * @returns {*}
   */
  $getInterface (target: interfaceKeys, prop?: string) {
    return this.$interface[target].getData(prop)
  }
  /**
   * 设置接口数据
   * @param {string} target 对应的接口名称
   * @param {string} prop 属性
   * @param {*} data 值
   */
  $setInterface (target: interfaceKeys, prop: string, data: string, useSetData?: boolean) {
    this.$interface[target].setData(prop, data, useSetData)
  }
  $setLayout (layoutOption?: LayoutDataInitOption, parentLayoutOption?: LayoutDataInitOption) {
    const option = layoutOption || parentLayoutOption
    this.$layout = new LayoutData(option)
  }
  $getLayout (): LayoutData
  $getLayout (prop: string): LayoutDataFormatData
  $getLayout (prop?: string) {
    if (prop) {
      return this.$layout.getData(prop)
    } else {
      return this.$layout
    }
  }
  $getModData(modType: string, payload?: Record<PropertyKey, any>) {
    return dictionaryFormatOption.unformat(this, modType, payload)
  }
  /**
   * 判断是否存在来源
   * @param {string} originFrom 来源
   * @returns {boolean}
   */
  $isOriginFrom (originFrom: string) {
    return this.originFrom.indexOf(originFrom) > -1
  }
  /**
   * 判断是否存在模块
   * @param {string} mod 模块
   * @returns {boolean}
   */
  $getMod (modType: string) {
    return this.$mod[modType]
  }
  /**
   * 触发可能存在的func函数
   * @param {string} funcName 函数名
   * @param {*} originData 数据
   * @param {object} payload 参数
   * @returns {*}
   */
  $triggerFunc (funcName: funcKeys, originData: unknown, payload: payloadType) {
    const itemFunc = this[funcName]
    if (itemFunc) {
      return itemFunc(originData, payload)
    } else {
      return originData
    }
  }
  /**
   * 获取originProp
   * @param {string} prop prop值
   * @param {string} originFrom originFrom值
   * @returns {string}
   */
  $getOriginProp (prop: string, originFrom: string) {
    if (this.prop == prop) {
      return this.$getInterface('originProp', originFrom)
    } else {
      return false
    }
  }


  /**
   * 将数据值挂载到目标数据的prop属性上
   * @param {object} targetData 目标数据
   * @param {string} prop 属性
   * @param {*} oData 数据源数据
   * @param {string} type 数据类型
   * @param {string} [formatFuncName] 需要触发的数据格式化函数名称
   * @param {object} [payload] originData(接口源数据)/targetData(本地目标数据)/type(数据来源接口)
   */
  $formatData(targetData: Record<PropertyKey, any>, prop: string, oData: any, type: string, formatFuncName: funcKeys, payload: {
    targetData: Record<PropertyKey, any>,
    originData: Record<PropertyKey, any>,
    depth?: number,
    type: string
  }) {
    let tData
    if (formatFuncName) {
      tData = this.$triggerFunc(formatFuncName, oData, payload)
    } else {
      tData = oData
    }
    if (type == 'number') {
      tData = $func.formatNum(tData)
    } else if (type == 'boolean') {
      tData = !!tData
    }
    $func.setProp(targetData, prop, tData, true)
  }

  /**
   * 生成formData的prop值，基于自身从originData中获取对应属性的数据并返回
   * @param {string} modType modType
   * @param {object} option 参数
   * @param {object} option.targetData 目标数据
   * @param {object} option.originData 源formdata数据
   * @param {string} [option.from] 调用来源
   * @returns {*}
   */
  $getFormData ({ targetData, originData, type, from = 'init' }: payloadType) {
    const mod = this.$getMod(type) as any
    let tData
    // 不存在mod情况下生成值无意义，不做判断
    if (mod) {
      // 存在源数据则获取属性值并调用主要模块的edit方法格式化，否则通过模块的getValueData方法获取初始值
      if (originData) {
        tData = this.$triggerFunc('edit', originData[this.prop], {
          type: type,
          targetData,
          originData
        })
      } else if (mod.getValueData) {
        if (from == 'reset') {
          tData = mod.getValueData('resetdata')
        } else {
          tData = mod.getValueData('initdata')
        }
      }
      // 调用模块的readyData
      if (mod.readyData) {
        mod.readyData().then(() => { /* */ }, (err: any) => {
          this.$exportMsg(`${type}模块readyData调用失败！`, 'error', {
            data: err,
            type: 'error'
          })
        })
      }
      // 模块存在edit函数时将当前数据进行edit操作
      if (mod.$func && mod.$func.edit) {
        tData = mod.$func.edit(tData, {
          type: type,
          targetData,
          originData,
          from: from
        })
      }
    }
    return tData
  }
}

export default DictionaryItem
