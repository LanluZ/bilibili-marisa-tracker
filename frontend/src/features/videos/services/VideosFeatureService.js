// Videos功能模块 - 服务层
import { VideoService, DateService } from '../../services/api.v2.js'

/**
 * 视频功能相关的业务逻辑服务
 */
export class VideosFeatureService {
  /**
   * 获取视频列表（带分页和过滤）
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 视频列表和分页信息
   */
  static async getVideosWithPagination(params = {}) {
    try {
      const {
        date,
        sortBy = 'view_count',
        sortOrder = 'desc',
        page = 1,
        limit = 15,
        zone
      } = params

      const videos = await VideoService.getVideos({
        date,
        sortBy,
        sortOrder,
        zone
      })

      // 客户端分页
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedVideos = videos.slice(startIndex, endIndex)

      return {
        videos: paginatedVideos,
        pagination: {
          current: page,
          total: Math.ceil(videos.length / limit),
          size: limit,
          totalItems: videos.length
        }
      }
    } catch (error) {
      console.error('获取视频列表失败:', error)
      throw error
    }
  }

  /**
   * 获取视频详情
   * @param {string} videoId - 视频ID
   * @returns {Promise<Object>} 视频详情
   */
  static async getVideoDetail(videoId) {
    try {
      return await VideoService.getVideoDetail(videoId)
    } catch (error) {
      console.error('获取视频详情失败:', error)
      throw error
    }
  }

  /**
   * 搜索视频
   * @param {string} keyword - 搜索关键词
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 搜索结果
   */
  static async searchVideos(keyword, filters = {}) {
    try {
      const videos = await VideoService.getVideos(filters)
      
      if (!keyword.trim()) {
        return videos
      }

      // 客户端搜索
      const lowercaseKeyword = keyword.toLowerCase()
      return videos.filter(video => 
        video.title?.toLowerCase().includes(lowercaseKeyword) ||
        video.author?.toLowerCase().includes(lowercaseKeyword) ||
        video.description?.toLowerCase().includes(lowercaseKeyword)
      )
    } catch (error) {
      console.error('搜索视频失败:', error)
      throw error
    }
  }

  /**
   * 获取可用日期列表
   * @returns {Promise<Array>} 日期列表
   */
  static async getAvailableDates() {
    try {
      return await DateService.getAvailableDates()
    } catch (error) {
      console.error('获取日期列表失败:', error)
      throw error
    }
  }

  /**
   * 获取视频统计信息
   * @param {string} date - 日期
   * @returns {Promise<Object>} 统计信息
   */
  static async getVideoStats(date) {
    try {
      const videos = await VideoService.getVideos({ date })
      
      const stats = {
        total: videos.length,
        totalViews: videos.reduce((sum, v) => sum + (v.view_count || 0), 0),
        totalLikes: videos.reduce((sum, v) => sum + (v.like_count || 0), 0),
        totalReplies: videos.reduce((sum, v) => sum + (v.reply_count || 0), 0),
        totalShares: videos.reduce((sum, v) => sum + (v.share_count || 0), 0),
        avgViews: 0,
        topVideo: null
      }

      if (stats.total > 0) {
        stats.avgViews = Math.round(stats.totalViews / stats.total)
        stats.topVideo = videos.reduce((max, v) => 
          (v.view_count || 0) > (max.view_count || 0) ? v : max
        )
      }

      return stats
    } catch (error) {
      console.error('获取视频统计失败:', error)
      throw error
    }
  }
}
