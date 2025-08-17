/**
 * API服务层 - 封装所有后端API调用
 */

/**
 * 基础请求函数
 */
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`API请求失败 [${url}]:`, error)
    throw error
  }
}

/**
 * 获取可用日期列表
 */
export const getDates = async () => {
  const data = await apiRequest('/api/dates')
  return data?.dates || []
}

/**
 * 获取视频数据
 * @param {Object} params 查询参数
 * @param {string} params.date 日期
 * @param {string} params.sortBy 排序字段
 * @param {string} params.order 排序顺序
 */
export const getVideos = async ({ date, sortBy = 'view_count', order = 'desc' } = {}) => {
  const params = new URLSearchParams({
    sort_by: sortBy,
    order: order
  })
  
  if (date) {
    params.append('date', date)
  }

  const data = await apiRequest(`/api/videos?${params}`)
  
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
    crawl_time: video.crawl_time || ''
  }))
  
  return processedVideos
}

/**
 * 获取爬虫状态
 */
export const getCrawlStatus = async () => {
  try {
    const data = await apiRequest('/api/crawl/status')
    return data || { is_crawling: false }
  } catch (error) {
    console.error('获取爬虫状态失败:', error)
    return { is_crawling: false }
  }
}

/**
 * 启动爬取任务
 */
export const startCrawl = async () => {
  const response = await fetch('/api/crawl/start', {
    method: 'POST'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '启动失败')
  }
  
  return true
}
