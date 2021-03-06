import $func from 'complex-func'
import LimitData, { LimitDataInitOption } from 'complex-func/src/build/LimitData'
import DefaultData, { DefaultDataInitOption } from './../data/DefaultData'
import DictionaryItem, { DictionaryItemInitOption } from './DictionaryItem'
import OptionData from './OptionData'
import LayoutData, { LayoutDataFormatData, LayoutDataInitOption } from './LayoutData'
import BaseData from '../data/BaseData'
import Data from '../data/Data'
import { objectAny } from '../../ts'
import PageList from './PageList'

// const propList = ['id', 'parentId', 'children']


export type formatOptionBuild = LimitDataInitOption | LimitData

export interface formatOption {
  clear?: boolean,
  build?: formatOptionBuild
}

interface optionType {
  isChildren?: boolean,
  build?: LimitData | LimitDataInitOption,
  empty?: boolean,
  tree?: boolean
}

type propDataItemType = {
  prop: string,
  data: any
}

type propDataType<T> = {
  id: T,
  parentId: T,
  children: T
}

export interface formDataOption {
  form?: objectAny,
  from?: string,
  limit?: LimitData | LimitDataInitOption,
}

export interface DictionaryListInitOption extends DefaultDataInitOption {
  option: optionType,
  layout?: LayoutDataInitOption,
  propData?: propDataType<string | propDataItemType>,
  list: DictionaryItemInitOption[]
}

class DictionaryList extends DefaultData {
  $data: Map<string, DictionaryItem>
  $layout!: LayoutData
  $option: OptionData
  $propData: propDataType<propDataItemType>
  constructor (initOption: DictionaryListInitOption) {
    super(initOption)
    this.$triggerCreateLife('DictionaryList', 'beforeCreate', initOption)
    this.$option = new OptionData({
      isChildren: false,
      build: $func.getLimitData(),
      empty: false,
      tree: false
    })
    this.$propData = {
      id: {
        prop: 'id',
        data: ''
      },
      parentId: {
        prop: 'parentId',
        data: ''
      },
      children: {
        prop: 'children',
        data: ''
      }
    }
    this.$data = new Map<string, DictionaryItem>()
    this.$initOption(initOption.option)
    this.$setLayout(initOption.layout)
    this.$initDictionaryList(initOption.list)
    this.$triggerCreateLife('DictionaryList', 'created', initOption)
  }
  $initOption (option: optionType = {}) {
    let prop:keyof optionType
    for (prop in option) {
      const data = option[prop]
      if (prop != 'build') {
        (this.$option as any).setData(prop, data)
      } else {
        (this.$option as any).setData(prop, $func.getLimitData(data as LimitDataInitOption, 'allow'), 'init')
      }
    }
  }

  // ????????????????????????
  rebuildData (initOption: DictionaryItemInitOption[], type = 'replace') {
    this.$initDictionaryList(initOption, type)
  }
  $initDictionaryList(initOptionList: DictionaryItemInitOption[], type = 'replace') {
    // ??????update????????????
    this.$triggerLife('beforeUpdate', this, initOptionList, type)
    if (type == 'init') {
      this.$data.clear()
    }
    const parentData = this.$getParent()
    const isChildren = this.$option.getData('isChildren') as boolean
    for (const n in initOptionList) {
      const ditemOption = initOptionList[n]
      // ????????????????????????????????????????????????????????????????????????
      this.$parseOptionFromParent(ditemOption, parentData, isChildren)
      let ditem = this.getItem(ditemOption.prop)
      const act = {
        build: true,
        children: true
      }
      if (ditem) {
        if (type == 'init') {
          // ???????????????????????????????????????=?????????????????????????????????
          act.build = false
          act.children = false
          this.$exportMsg(`??????????????????:${ditemOption.prop}??????!`)
        } else if (type == 'push') {
          // ???????????????????????????ditem????????????????????????????????????
          act.build = false
        } else if (type == 'replace') {
          // ?????????????????????????????????
        }
      }
      // ???????????????????????????
      if (act.build) {
        // ??????????????????
        ditemOption.parent = this
        ditem = new DictionaryItem(ditemOption, {
          layout: this.$getLayout()
        })
        this.$data.set(ditem.prop, ditem)
      }
      if (act.children) {
        // ?????????????????????
        this.$initDictionaryItemChildren(ditem!, ditemOption)
      }
    }
  }
  /**
   * ?????????????????????.????????????????????????????????????
   * @param {object} optiondata DictionaryItem???????????????
   * @param {*} parentData ?????????
   * @param {*} isChildren ???????????????
   */
  $parseOptionFromParent (optiondata: DictionaryItemInitOption, parentData?: Data, isChildren?: boolean) {
    if (isChildren && !optiondata.originFrom && parentData && (parentData as DictionaryItem).originFrom) {
      optiondata.originFrom = (parentData as DictionaryItem).originFrom
    }
  }
  /**
   * ???????????????????????????,???????????????????????????
   * @param {DictionaryItem} ditem ??????????????????
   * @param {object} originOption ?????????????????????
   * @returns {'' | 'self' | 'build'}
   */
  $parseChildrenBuildType (ditem: DictionaryItem, originOption: DictionaryItemInitOption) {
    let initOption:DictionaryListInitOption | string | undefined = originOption.dictionary
    let type: '' | 'self' | 'build' = ''
    if (this.$option.getData('tree') && (this.$getPropData('prop', 'children') == ditem.prop) && initOption === undefined) {
      initOption = 'self'
    }
    if (initOption == 'self') {
      type = 'self'
      if (originOption.type === undefined) {
        ditem.$setInterface('type', 'default', 'array')
      }
    } else if (initOption) {
      type = 'build'
    }
    return type
  }
  /**
   * ??????????????????????????????
   * @param {DictionaryItem} ditem ??????????????????
   * @param {object} originOption ?????????????????????
   * @param {boolean} isChildren ????????????
   */
  $initDictionaryItemChildren (ditem: DictionaryItem, originOption: DictionaryItemInitOption, isChildren = true) {
    const type = this.$parseChildrenBuildType(ditem, originOption)
    if (type == 'build') {
      const initOption = originOption.dictionary as DictionaryListInitOption
      if (!initOption.option) {
        initOption.option = {}
      }
      if (initOption.option.isChildren === undefined) {
        initOption.option.isChildren = isChildren
      }
      // ?????????????????????build??????
      if (!initOption.option.build) {
        initOption.option.build = this.$option.getData('build') as LimitData
      }
      initOption.parent = ditem
      if (!initOption.layout) {
        initOption.layout = this.$getLayout()
      }
      ditem.$dictionary = new DictionaryList(initOption)
    } else if (type == 'self') {
      ditem.$dictionary = this
    }
  }



  /**
   * ?????????????????????
   * @param {object[]} targetList ????????????
   * @param {object[]} originList ???????????????
   * @param {string} [originFrom] ??????originFrom
   * @param {object} [option] ?????????
   * @param {boolean} [formatPrototype] ?????????????????????
   * @param {number} [depth] ??????
   */
   formatListData (targetList: objectAny[], originList: objectAny[], originFrom = 'list', option:formatOption = {}, formatPrototype = true, depth?: number) {
    if (option.clear === undefined || option.clear) {
      $func.clearArray(targetList)
    }
    for (const n in originList) {
      const item = this.buildData(originList[n], originFrom, option.build, formatPrototype, depth)
      targetList.push(item)
    }
  }
  /**
   * ????????????????????????????????????
   * @param {object} originData ?????????
   * @param {string} [originFrom] ??????originFrom
   * @param {object} [option] ?????????
   * @param {boolean} [formatPrototype] ?????????????????????
   * @param {number} [depth] ??????
   * @returns {object}
   */
  buildData(originData:objectAny, originFrom = 'list', option?: formatOptionBuild, formatPrototype?: boolean, depth?: number) {
    return this.updateData({}, originData, originFrom, option, formatPrototype, depth)
  }
  /**
   * ???????????????????????????
   * @param {object} targetData ????????????
   * @param {object} originData ?????????
   * @param {string} [originFrom] ??????originFrom
   * @param {boolean} [formatPrototype] ?????????????????????
   * @param {number} [depth] ??????
   * @returns {object}
   */
  updateData(targetData: objectAny, originData: formatOptionBuild, originFrom = 'info', option?: formatOptionBuild, formatPrototype?: boolean, depth?: number) {
    return this.formatData(targetData, originData, originFrom, option, formatPrototype, depth)
  }
  /**
   * ???????????????????????????
   * @param {object} targetData ????????????
   * @param {object} originData ?????????
   * @param {string} originFrom ??????originFrom
   * @param {object} [option] ?????????
   * @param {boolean} [formatPrototype] ?????????????????????
   * @param {number} [depth] ??????
   * @returns {object}
   */
  formatData(targetData: objectAny, originData: formatOptionBuild, originFrom?: string, option?: formatOptionBuild, formatPrototype?: boolean, depth?: number) {
    if (!targetData) {
      targetData = {}
    }
    if (!originData) {
      originData = {}
    }
    if (!originFrom) {
      originFrom = 'list'
    }
    if (!option) {
      option = this.$option.getData('build') as LimitData
    }
    if (!(option as any).getLimit) {
      option = $func.getLimitData(option)
    }
    if (depth === undefined) {
      depth = 0
    }
    return this.$formatDataStart(targetData, originData, originFrom, option as LimitData, !!formatPrototype, depth)
  }
  $formatPrototype(targetData: objectAny, depth: number) {
    const currentPrototype = Object.create(Object.getPrototypeOf(targetData))
    currentPrototype.$depth = depth
    Object.setPrototypeOf(targetData, currentPrototype)
  }
  /**
   * ???????????????????????????START
   * @param {object} targetData ????????????
   * @param {object} originData ?????????
   * @param {string} originFrom ??????originFrom
   * @param {object} [option] ?????????
   * @param {boolean} [formatPrototype] ?????????????????????
   * @param {number} [depth] ??????
   * @returns {object}
   */
  $formatDataStart(targetData: objectAny, originData: objectAny, originFrom: string, option: LimitData, formatPrototype: boolean, depth = 0) {
    for (const ditem of this.$data.values()) {
      this.$formatDataNext(ditem, targetData, originData, originFrom, option, formatPrototype, depth)
    }
    if (formatPrototype) {
      this.$formatPrototype(targetData, depth)
    }
    return targetData
  }
  /**
   * ???????????????
   * @param {DictionaryItem} ditem ??????
   * @param {object} targetData ????????????
   * @param {object} originData ?????????
   * @param {string} originFrom ??????originFrom
   * @param {object} [option] ?????????
   * @param {boolean} [formatPrototype] ?????????????????????
   * @param {number} [depth] ??????
   * @returns {object}
   */
  $formatDataNext(ditem: DictionaryItem, targetData: objectAny, originData: objectAny, originFrom: string, option: LimitData, formatPrototype: boolean, depth: number) {
    let build = false
    if (ditem.$isOriginFrom(originFrom)) {
      build = true
    } else if (option.getLimit(originFrom)) {
      build = false
    }
    if (build) {
      const type = ditem.$getInterface('type', originFrom) as string
      const originProp = ditem.$getInterface('originProp', originFrom) as string
      let oData = $func.getProp(originData, originProp)
      if (ditem.$dictionary) {
        depth++
        if (type != 'array') {
          if ($func.getType(oData) == 'object') {
            oData = ditem.$dictionary.$formatDataStart({}, oData, originFrom, option, formatPrototype, depth)
          } else {
            oData = {}
          }
        } else {
          if ($func.getType(oData) == 'array') {
            const oList = []
            for (let i = 0; i < oData.length; i++) {
              const oItem = ditem.$dictionary.$formatDataStart({}, oData[i], originFrom, option, formatPrototype, depth)
              oList.push(oItem)
            }
            oData = oList
          } else {
            oData = []
          }
        }
      }
      ditem.$formatData(targetData, ditem.prop, oData, type, 'format', {
        targetData: targetData,
        originData: originData,
        depth: depth,
        type: originFrom
      })
    }
  }

  $getList(modType: string, dataMap?: Map<string, DictionaryItem>) {
    if (!dataMap) {
      dataMap = this.$data
    }
    const list: DictionaryItem[] = []
    for (const ditem of dataMap.values()) {
      const mod = ditem.$getMod(modType)
      if (mod) {
        list.push(ditem)
      }
    }
    return list
  }
  $getPageList(modType: string, payload?: objectAny) {
    return this.$buildPageList(modType, this.$getList(modType), payload)
  }
  $buildPageList(modType: string, list: DictionaryItem[], payload?: objectAny) {
    const pageList = new PageList()
    for (let n = 0; n < list.length; n++) {
      const ditem = list[n]
      const pitem = ditem.$getModData(modType, payload)
      if (ditem.$dictionary) {
        const mod = ditem.$getMod(modType)
        if (mod && mod.$children) {
          let childrenProp = mod.$children
          if (childrenProp === true) {
            childrenProp = 'children'
          }
          pitem[childrenProp] = ditem.$dictionary.$getPageList(modType, payload)
        }
      }
      pageList.push(pitem)
    }
    return pageList
  }

  /**
   * ?????????????????????????????????form??????
   * @param {DictionaryItem[]} modList ????????????
   * @param {string} modType ????????????
   * @param {*} originData ???????????????
   * @param {object} option ?????????
   * @param {object} [option.form] ??????form??????
   * @param {string} [option.from] ????????????
   * @param {string[]} [option.limit] ??????????????????=>?????????????????????????????????????????????
   * @returns {object}
   */
   $buildFormData(modList: DictionaryItem[], modType: string, originData: any, option:formDataOption = {}) {
    const formData = option.form || {}
    const from = option.from
    const limit = $func.getLimitData(option.limit)
    const size = modList.length
    for (let n = 0; n < size; n++) {
      const ditem = modList[n]
      if (!limit.getLimit(ditem.prop)) {
        const tData = ditem.$getFormData({
          targetData: formData,
          originData: originData,
          type: modType,
          from: from
        })
        $func.setProp(formData, ditem.prop, tData, true)
      }
    }
    return formData
  }
  /**
   * ??????formdata??????????????????????????????????????????
   * @param {object} formData form??????
   * @param {DictionaryItem[]} modList ????????????
   * @param {string} modType modType
   * @returns {object}
   */
  $buildEditData(formData: objectAny, modList: DictionaryItem[], modType: string) {
    const editData = {}
    for (let n = 0; n < modList.length; n++) {
      const ditem = modList[n]
      let add = true
      if (!ditem.$mod[modType].required) {
        /*
          ??????check?????????check??????
          ??????????????????2?????????
          1.?????????check ??????data ,data???????????????
          2.??????check,??????check?????????????????????????????????
        */
        add = ditem.$triggerFunc('check', formData[ditem.prop], {
          targetData: editData,
          originData: formData,
          type: modType
        })
        // empty????????????????????? ?????? checkFg????????????????????? ?????????empty???false??????????????????????????????
        if (!add) {
          add = this.$option.getData('empty') as boolean
        }
      }
      if (add) {
        let oData = formData[ditem.prop]
        if (ditem.$mod[modType].trim) {
          oData = $func.trimData(oData)
        }
        ditem.$formatData(editData, ditem.$getInterface('originProp', modType)!, oData, ditem.$getInterface('type', modType)!, 'post', {
          targetData: editData,
          originData: formData,
          type: modType
        })
      }
    }
    return editData
  }

  /**
   * ??????????????????
   * @param {*} data ???
   * @param {string} [prop] ???????????????
   * @returns {DictionaryItem}
   */
  getItem (data: string): undefined | DictionaryItem
  getItem (data: any, prop: string): undefined | DictionaryItem
  getItem (data: string | any, prop?: string) {
    if (!prop) {
      return this.$data.get(data)
    } else {
      for (const ditem of this.$data.values()) {
        if ((ditem as any)[prop] == data) {
          return ditem
        }
      }
    }
  }
  /**
   * ???????????????
   * @param {*} data ???
   * @param {'data' | 'prop'} [target = 'data'] ????????????
   * @param {'id' | 'parentId' | 'children'} [prop = 'id'] ??????
   */
  $setPropData (data: any, target:'data' | 'prop' = 'data', prop: 'id' | 'parentId' | 'children' = 'id') {
    this.$propData[prop][target] = data
  }
  /**
   * ???????????????
   * @param {'data' | 'prop'} [target = 'data'] ????????????
   * @param {'id' | 'parentId' | 'children'} [prop = 'id'] ??????
   * @returns {*}
   */
  $getPropData (target:'data' | 'prop' = 'data', prop: 'id' | 'parentId' | 'children' = 'id') {
    return this.$propData[prop][target]
  }
  /**
   * ??????LayoutData
   * @param {object} data LayoutData??????
   */
  $setLayout (data?: LayoutDataInitOption) {
    this.$layout = new LayoutData(data)
  }
  /**
   * ??????????????????
   * @param {string} [prop] ??????
   * @returns {object | LayoutData}
   */
  $getLayout (): LayoutData
  $getLayout (prop: string): LayoutDataFormatData
  $getLayout (prop?: string) {
    if (prop) {
      return this.$layout.getData(prop)
    } else {
      return this.$layout
    }
  }
  /**
   * ????????????
   * @param {object} target ??????????????????
   */
  $install (target: BaseData) {
    // ????????????
    this.$onLife('updated', {
      id: target.$getId('dictionaryUpdated'),
      data: (...args) => {
        target.$triggerLife('dictionaryUpdated', ...args)
      }
    })
  }
  /**
   * ????????????
   * @param {object} target ??????????????????
   */
   $uninstall (target: BaseData) {
    // ??????????????????
    this.$offLife('updated', target.$getId('dictionaryUpdated'))
  }
}

DictionaryList.$name = 'DictionaryList'

export default DictionaryList
