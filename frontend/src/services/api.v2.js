import apiClient from '../shared/utils/apiClient.js'
import { API_CONFIG } from '../shared/constants/app.js'

/**
 * 视频相关 API 服务
 */
export class VideoService {
  /**
   * 获取视频列表
   * @param {Object} params - 查询参数
   * @param {string} params.date - 日期
   * @param {string} params.sortBy - 排序字段
   * @param {string} params.order - 排序顺序
   * @param {string} params.mainZone - 主分区ID
   * @param {string} params.subZone - 子分区ID
   * @returns {Promise<Video[]>} 视频列表
   */
  static async getVideos({ 
    date, 
    sortBy = 'view_count', 
    order = 'desc', 
    mainZone = '', 
    subZone = '' 
  } = {}) {
    const params = {
      sort_by: sortBy,
      order: order,
    }
    
    if (date) params.date = date
    if (mainZone) params.main_zone = mainZone
    if (subZone) params.sub_zone = subZone

    const data = await apiClient.get(API_CONFIG.ENDPOINTS.VIDEOS, params)
    
    // 确保数据的完整性，添加默认值
    const processedVideos = (data.videos || []).map(video => ({
      id: video.id || Math.random().toString(36),
      bvid: video.bvid || null,
      aid: video.aid || null,
      cid: video.cid || 0,
      title: video.title || '无标题',
      pic: video.pic || '',
      view_count: video.view_count || 0,
      online_count: video.online_count || '0',
      max_online_count: video.max_online_count || 0,
      max_online_time: video.max_online_time || null,
      crawl_date: video.crawl_date || '未知',
      crawl_time: video.crawl_time || '',
      tid_v2: video.tid_v2 || null
    }))
    
    return processedVideos
  }

  /**
   * 获取视频详情
   * @param {string} bvid - 视频BV号
   * @param {string|number} [aid] - 视频AV号
   * @returns {Promise<VideoDetail>} 视频详情
   */
  static async getVideoDetail(bvid, aid = null) {
    const params = {}
    if (bvid) params.bvid = bvid
    if (aid) params.aid = aid
    
    if (!bvid && !aid) {
      throw new Error('bvid或aid至少需要提供一个')
    }

    const data = await apiClient.get(API_CONFIG.ENDPOINTS.VIDEO_DETAIL, params)
    return data
  }

  /**
   * 批量更新视频详情
   * @returns {Promise<Object>} 更新结果
   */
  static async batchUpdateVideoDetails() {
    // 实现批量更新逻辑
    // 这里需要根据后端API实现
    throw new Error('批量更新功能待实现')
  }
}

/**
 * 日期相关 API 服务
 */
export class DateService {
  /**
   * 获取可用日期列表
   * @returns {Promise<string[]>} 日期列表
   */
  static async getDates() {
    const data = await apiClient.get(API_CONFIG.ENDPOINTS.DATES)
    return data?.dates || []
  }
}

/**
 * 爬虫相关 API 服务
 */
export class CrawlerService {
  /**
   * 获取爬虫状态
   * @returns {Promise<CrawlStatus>} 爬虫状态
   */
  static async getCrawlStatus() {
    try {
      const data = await apiClient.get(API_CONFIG.ENDPOINTS.CRAWL_STATUS)
      return data || { is_crawling: false }
    } catch (error) {
      console.error('获取爬虫状态失败:', error)
      return { is_crawling: false }
    }
  }

  /**
   * 启动爬取任务
   * @returns {Promise<Object>} 启动结果
   */
  static async startCrawl() {
    return apiClient.post(API_CONFIG.ENDPOINTS.CRAWL_START)
  }
}

/**
 * 统计相关 API 服务
 */
export class StatsService {
  /**
   * 获取分区统计信息
   * @param {string} date - 日期
   * @returns {Promise<ZoneStats>} 分区统计
   */
  static async getZoneStats(date) {
    const params = date ? { date } : {}
    const data = await apiClient.get(API_CONFIG.ENDPOINTS.ZONE_STATS, params)
    return data?.zone_stats || {}
  }
}

// 向后兼容的导出
export const getDates = DateService.getDates
export const getVideos = VideoService.getVideos
export const getVideoDetail = VideoService.getVideoDetail
export const getCrawlStatus = CrawlerService.getCrawlStatus
export const startCrawl = CrawlerService.startCrawl
export const getZoneStats = StatsService.getZoneStats
