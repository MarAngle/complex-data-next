import BaseData, { BaseDataInitOption } from "../data/BaseData"
import { formDataOption } from "../lib/DictionaryList"
import { ModuleDataType } from "../lib/ModuleData"
import { formatInitOption } from "../utils"

export interface SearchDataInitOption extends BaseDataInitOption {
  mod?: string,
  formOption?: resetFormOption
}

export interface resetFormOption {
  copy?: boolean
  observe?: boolean
  limit?: formDataOption['limit']
}


class SearchData extends BaseData implements ModuleDataType {
  static $name = 'SearchData'
  $mod: string
  $data: Record<PropertyKey, any>
  $current: Record<PropertyKey, any>
  constructor(initOption: SearchDataInitOption) {
    initOption = formatInitOption(initOption)
    super(initOption)
    this.$triggerCreateLife('SearchData', 'beforeCreate', initOption)
    this.$mod = initOption.mod || 'search'
    this.$data = {}
    this.$current = {}
    this.$initSearchData(this.$mod, initOption.formOption)
    this.$onLife('reseted', {
      id: 'AutoSearchDataReseted',
      data: (instantiater, resetOption) => {
        if (this.$parseResetOption(resetOption, 'data') !== false) {
          this.$resetData()
        }
      }
    })
    this.$triggerCreateLife('SearchData', 'created')
  }
  $initSearchData(modName: string, option?: resetFormOption) {
    const list = this.$module.dictionary!.$getPageList(modName)
    this.$data[modName] = {
      list: list,
      form: {}
    }
    this.$resetFormData('init', modName, option)
  }
  $resetData() {
    for (const modName in this.$data) {
      this.$resetFormData('reset', modName)
    }
  }
  $resetFormData(from = 'init' , modName?: string, option: resetFormOption = {}) {
    if (!modName) {
      modName = this.$mod
    }
    const targetData = this.$data[modName]
    const list = targetData.list
    this.$module.dictionary!.$buildFormData(list, modName, undefined, {
      form: targetData.form,
      from: from,
      limit: option.limit
    })
    if (option.observe) {
      targetData.list.setData(targetData.form)
    }
    if (option.copy !== false) {
      this.$syncFormData(modName)
    }
  }
  $syncFormData(modName?: string) {
    if (!modName) {
      modName = this.$mod
    }
    const targetData = this.$data[modName]
    this.$current[modName] = this.$module.dictionary!.$buildEditData(targetData.form, targetData.list, modName)
  }
  // install (target: BaseData) {
  //   target.$onLife('reseted', {
  //     id: this.$getId('Reseted'),
  //     data: (instantiater, resetOption) => {
  //       if (target.$parseResetOption(resetOption, 'search') !== false) {
  //         this.$reset()
  //       }
  //     }
  //   })
  // }
  // /**
  //  * 模块卸载
  //  * @param {object} target 卸载到的目标
  //  */
  // uninstall(target: BaseData) {
  //   target.$offLife('reseted', this.$getId('Reseted'))
  // }
  // $reset(option?: boolean) {
  //   if (option !== false) {
  //     this.reset(true)
  //   }
  // }
  // $destroy(option?: boolean) {
  //   if (option !== false) {
  //     this.$reset(option)
  //   }
  // }
}

export default SearchData