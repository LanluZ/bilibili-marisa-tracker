import zonesData from './bilibiliZones.json'

/**
 * B站分区工具类
 * 提供tid_v2与分区名称的转换功能
 */
class BilibiliZoneUtils {
  constructor() {
    this.zones = zonesData.bilibiliZonesV2
    this.flatZoneMap = this._buildFlatZoneMap()
  }

  /**
   * 构建平铺的分区映射表，包含主分区和子分区
   * @private
   */
  _buildFlatZoneMap() {
    const flatMap = new Map()
    
    Object.entries(this.zones).forEach(([mainTid, mainZone]) => {
      // 添加主分区
      flatMap.set(parseInt(mainTid), {
        tid_v2: parseInt(mainTid),
        name: mainZone.name,
        type: 'main',
        isMain: true,
        mainZone: {
          tid_v2: parseInt(mainTid),
          name: mainZone.name
        }
      })
      
      // 添加子分区
      if (mainZone.children) {
        Object.entries(mainZone.children).forEach(([subTid, subName]) => {
          flatMap.set(parseInt(subTid), {
            tid_v2: parseInt(subTid),
            name: subName,
            type: 'sub',
            isMain: false,
            mainZone: {
              tid_v2: parseInt(mainTid),
              name: mainZone.name
            }
          })
        })
      }
    })
    
    return flatMap
  }

  /**
   * 根据tid_v2获取分区名称
   * @param {number|string} tid_v2 - 分区ID
   * @returns {string|null} 分区名称，不存在则返回null
   */
  getZoneName(tid_v2) {
    const zone = this.flatZoneMap.get(parseInt(tid_v2))
    return zone ? zone.name : null
  }

  /**
   * 根据tid_v2获取完整的分区信息
   * @param {number|string} tid_v2 - 分区ID
   * @returns {Object|null} 分区信息对象
   */
  getZoneInfo(tid_v2) {
    return this.flatZoneMap.get(parseInt(tid_v2)) || null
  }

  /**
   * 根据子分区tid_v2获取主分区信息
   * @param {number|string} tid_v2 - 子分区ID
   * @returns {Object|null} 主分区信息
   */
  getMainZone(tid_v2) {
    const zone = this.flatZoneMap.get(parseInt(tid_v2))
    return zone ? zone.mainZone : null
  }

  /**
   * 获取所有主分区列表
   * @returns {Array} 主分区列表
   */
  getAllMainZones() {
    return Object.entries(this.zones)
      .filter(([, zone]) => !zone.hidden) // 过滤隐藏分区
      .map(([tid, zone]) => ({
        tid_v2: parseInt(tid),
        name: zone.name,
        children: zone.children || {}
      }))
      .sort((a, b) => a.tid_v2 - b.tid_v2)
  }

  /**
   * 获取指定主分区的所有子分区
   * @param {number|string} mainTid - 主分区ID
   * @returns {Array} 子分区列表
   */
  getSubZones(mainTid) {
    const mainZone = this.zones[mainTid.toString()]
    if (!mainZone || !mainZone.children) {
      return []
    }
    
    return Object.entries(mainZone.children).map(([tid, name]) => ({
      tid_v2: parseInt(tid),
      name,
      mainZone: {
        tid_v2: parseInt(mainTid),
        name: mainZone.name
      }
    }))
  }

  /**
   * 搜索分区（按名称模糊匹配）
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的分区列表
   */
  searchZones(keyword) {
    if (!keyword) return []
    
    const results = []
    for (const zone of this.flatZoneMap.values()) {
      if (zone.name.includes(keyword)) {
        results.push(zone)
      }
    }
    
    return results.sort((a, b) => {
      // 主分区优先，然后按tid排序
      if (a.isMain !== b.isMain) {
        return a.isMain ? -1 : 1
      }
      return a.tid_v2 - b.tid_v2
    })
  }

  /**
   * 获取分区的完整路径（主分区 > 子分区）
   * @param {number|string} tid_v2 - 分区ID
   * @returns {string} 分区路径
   */
  getZonePath(tid_v2) {
    const zone = this.flatZoneMap.get(parseInt(tid_v2))
    if (!zone) return ''
    
    if (zone.isMain) {
      return zone.name
    } else {
      return `${zone.mainZone.name} > ${zone.name}`
    }
  }

  /**
   * 检查是否为有效的分区ID
   * @param {number|string} tid_v2 - 分区ID
   * @returns {boolean} 是否有效
   */
  isValidZone(tid_v2) {
    return this.flatZoneMap.has(parseInt(tid_v2))
  }

  /**
   * 获取视频类型的中文名称
   * @param {number} copyright - 视频类型 (1:原创, 2:转载)
   * @returns {string} 类型名称
   */
  getCopyrightName(copyright) {
    const copyrightMap = {
      1: '原创',
      2: '转载'
    }
    return copyrightMap[copyright] || '未知'
  }

  /**
   * 格式化视频详情中的分区信息
   * @param {Object} videoDetail - 视频详情对象
   * @returns {Object} 格式化后的分区信息
   */
  formatVideoZoneInfo(videoDetail) {
    const result = {
      tid_v2: videoDetail.tid_v2,
      zoneName: null,
      zonePath: null,
      mainZone: null,
      copyright: videoDetail.copyright,
      copyrightName: null
    }
    
    if (videoDetail.tid_v2) {
      result.zoneName = this.getZoneName(videoDetail.tid_v2)
      result.zonePath = this.getZonePath(videoDetail.tid_v2)
      result.mainZone = this.getMainZone(videoDetail.tid_v2)
    }
    
    if (videoDetail.copyright) {
      result.copyrightName = this.getCopyrightName(videoDetail.copyright)
    }
    
    return result
  }
}

// 创建单例实例
const bilibiliZoneUtils = new BilibiliZoneUtils()

// 导出工具函数（向后兼容）
export const getZoneName = (tid_v2) => bilibiliZoneUtils.getZoneName(tid_v2)
export const getZoneInfo = (tid_v2) => bilibiliZoneUtils.getZoneInfo(tid_v2)
export const getMainZone = (tid_v2) => bilibiliZoneUtils.getMainZone(tid_v2)
export const getAllMainZones = () => bilibiliZoneUtils.getAllMainZones()
export const getSubZones = (mainTid) => bilibiliZoneUtils.getSubZones(mainTid)
export const searchZones = (keyword) => bilibiliZoneUtils.searchZones(keyword)
export const getZonePath = (tid_v2) => bilibiliZoneUtils.getZonePath(tid_v2)
export const isValidZone = (tid_v2) => bilibiliZoneUtils.isValidZone(tid_v2)
export const getCopyrightName = (copyright) => bilibiliZoneUtils.getCopyrightName(copyright)
export const formatVideoZoneInfo = (videoDetail) => bilibiliZoneUtils.formatVideoZoneInfo(videoDetail)

// 导出类和实例
export { BilibiliZoneUtils }
export default bilibiliZoneUtils
