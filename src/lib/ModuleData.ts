/* eslint-disable @typescript-eslint/no-explicit-any */
import { exportMsg, getType } from 'complex-utils'
import Data, { cascadeType } from '../data/Data'
import BaseData from '../data/BaseData'
import DependData, { DependDataInitOption } from './DependData'
import StatusData, { StatusDataInitOption } from './StatusData'
import PromiseData, { PromiseDataInitData } from './PromiseData'
import UpdateData, { UpdateDataInitOption } from './UpdateData'
import PaginationData, { PaginationDataInitOption } from './PaginationData'
import ChoiceData, { ChoiceDataInitOption } from './ChoiceData'
import DictionaryList, { DictionaryListInitOption } from './DictionaryList'
import SearchData, { SearchDataInitOption } from './../data/SearchData'

const ModuleDictionaryMap: Map<string, any> = new Map()

export interface ModuleDataInitOption {
  depend?: DependDataInitOption
  status?: StatusDataInitOption
  promise?: PromiseDataInitData
  update?: UpdateDataInitOption
  pagination?: PaginationDataInitOption
  choice?: ChoiceDataInitOption
  dictionary?: DictionaryListInitOption
  search?: SearchDataInitOption
}

export type moduleKeys = keyof ModuleDataInitOption

export const ModuleDataKeys: moduleKeys[] = ['status', 'promise', 'depend', 'update', 'dictionary', 'search', 'pagination', 'choice']

export interface moduleResetOptionType {
  status?: cascadeType<undefined | boolean>
  promise?: cascadeType<undefined | boolean>
  depend?: cascadeType<undefined | boolean>
  update?: cascadeType<undefined | boolean>
  dictionary?: cascadeType<undefined | boolean>
  search?: cascadeType<undefined | boolean>
  pagination?: cascadeType<undefined | boolean>
  choice?: cascadeType<undefined | boolean>
}

export interface ModuleDataType {
  $reset: ((option?: boolean, ...args: any[]) => any) | ((option?: cascadeType<undefined | boolean>, ...args: any[]) => any)
  $destroy: ((option?: boolean, ...args: any[]) => any) | ((option?: cascadeType<undefined | boolean>, ...args: any[]) => any)
}

export interface setDataOption {
  from?: string,
  build?: boolean
}

class ModuleData extends Data<BaseData<any>> {
  static $name = 'ModuleData'
  status?: StatusData
  promise?: PromiseData
  depend?: DependData
  update?: UpdateData
  dictionary?: DictionaryList
  search?: SearchData
  pagination?: PaginationData
  choice?: ChoiceData
  constructor(initOption: undefined | ModuleDataInitOption, parent: BaseData<any>) {
    super()
    this.$setParent(parent)
    if (initOption && getType(initOption) === 'object') {
      let modName: moduleKeys
      for (modName in initOption) {
        this.$setData(modName, initOption[modName], {
          from: 'init'
        })
      }
    }
  }
  static setDictionary(modName: moduleKeys, ModuleClassData: any, replace?: boolean) {
    if (ModuleData.getDictionary(modName) && !replace) {
      exportMsg(`${modName}模块类已存在，无法进行替换操作！`, 'error', {
        data: ModuleClassData,
        type: 'warn'
      })
      return
    }
    if (!ModuleClassData.$name) {
      exportMsg(`${modName}对应的模块类不存在$name属性，可能会导致判断错误！`, 'error', {
        data: ModuleClassData,
        type: 'warn'
      })
    }
    ModuleDictionaryMap.set(modName, ModuleClassData)
  }
  static getDictionaryMap() {
    return ModuleDictionaryMap
  }
  static getDictionary(modName: moduleKeys) {
    return ModuleDictionaryMap.get(modName)
  }
  $buildModuleData(modName: moduleKeys, modData?: any) {
    const ModuleClassData = ModuleData.getDictionary(modName)
    if (ModuleClassData) {
      if (modData === true) {
        return new ModuleClassData()
      } else if (modData && !(modData instanceof ModuleClassData)) {
        return new ModuleClassData(modData, this.$getParent())
      }
    } else if (ModuleDictionaryMap.size === 0) {
      this.$exportMsg(`Module模块为未赋值，请检查引用方式！`, 'error')
    }
    return modData
  }
  /**
   * 设置模块
   * @param {string} modName 模块名
   * @param {object} modData 模块实例
   * @param {boolean} [build] 自动构建判断值，默认为真
   */
  $setData(modName: moduleKeys, modData?: any, { from = '', build = true }: setDataOption = {}, unTriggerSync?: boolean) {
    if (from !== 'init') {
      this.$uninstallData(modName, 'set:' + from, unTriggerSync)
    }
    if (build) {
      modData = this.$buildModuleData(modName, modData)
    }
    this.$installData(modName, modData, from, unTriggerSync)
  }
  $getData(modName: moduleKeys) {
    return this[modName]
  }
  /**
   * 卸载模块
   * @param {string} modName 模块名
   * @returns {object | undefined} 卸载的模块
   */
  $uninstallData(modName: moduleKeys, from?: string, unTriggerSync?: boolean) {
    const modData = this[modName]
    if (modData) {
      // 存在旧数据时需要对旧数据进行卸载操作
      if (modData.$uninstall) {
        modData.$uninstall(this.$getParent()!, from)
      }
      this[modName] = undefined
    }
    if (!unTriggerSync) {
      this.$syncData(true, '$uninstallData')
    }
    return modData
  }
  /**
   * 加载模块
   * @param {string} modName 模块名
   * @param {object} modData 模块实例
   */
  $installData(modName: moduleKeys, modData: any, from?: string, unTriggerSync?: boolean) {
    this[modName] = modData
    if (modData && modData.$install) {
      modData.$install(this.$getParent(), from)
    }
    if (!unTriggerSync) {
      this.$syncData(true, '$installData')
    }
  }
  /**
   * 触发指定模块的指定函数
   * @param {string} modName 模块名
   * @param {string} method 函数名
   * @param {*[]} args 参数
   * @returns {*}
   */
  $triggerMethod(modName: moduleKeys, method: string, args: any[]) {
    const mod = this[modName]
    if (mod) {
      const type = typeof (mod as any)[method]
      if (type === 'function') {
        return (mod as any)[method](...args)
      } else {
        this.$exportMsg(`${modName}模块${method}属性为${type}，函数触发失败！`)
      }
    } else {
      this.$exportMsg(`不存在${modName}模块`)
    }
  }
  $selfName() {
    let selfName = super.$selfName()
    if (this.$parent) {
      selfName = `[${this.$parent.$selfName()}=>${selfName}]`
    }
    return selfName
  }
  $reset(resetOption: moduleResetOptionType = {}, ...args: any[]) {
    ModuleDataKeys.forEach(modName => {
      const modData = this.$getData(modName) as any
      if (resetOption[modName] !== false) {
        if (modData && modData.$reset) {
          modData.$reset(resetOption[modName], ...args)
        }
      }
    })
  }
  $destroy(destroyOption: moduleResetOptionType = {}, ...args: any[]) {
    this.$reset(destroyOption)
    ModuleDataKeys.forEach(modName => {
      const modData = this.$getData(modName) as any
      if (destroyOption[modName] !== false) {
        if (modData && modData.$destroy) {
          modData.$destroy(destroyOption[modName], ...args)
        }
      }
    })
  }
}

export default ModuleData
