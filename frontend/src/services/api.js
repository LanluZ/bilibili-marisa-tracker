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
 * @param {string} params.mainZone 主分区ID
 * @param {string} params.subZone 子分区ID
 */
export const getVideos = async ({ date, sortBy = 'view_count', order = 'desc', mainZone = '', subZone = '' } = {}) => {
  const params = new URLSearchParams({
    sort_by: sortBy,
    order: order
  })
  
  if (date) {
    params.append('date', date)
  }
  
  if (mainZone) {
    params.append('main_zone', mainZone)
  }
  
  if (subZone) {
    params.append('sub_zone', subZone)
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
    crawl_time: video.crawl_time || '',
    tid_v2: video.tid_v2 || null  // 添加分区信息
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

/**
 * 更新单个视频的详细信息
 * @param {string} bvid 视频的bvid
 */
export const updateVideoDetail = async (bvid) => {
  const response = await fetch(`/api/video/update?bvid=${encodeURIComponent(bvid)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '更新视频详情失败')
  }
  
  return await response.json()
}

/**
 * 批量更新指定日期所有视频的详细信息
 * @param {string} date 日期 (YYYY-MM-DD格式)
 * @param {Function} onProgress 进度回调函数
 */
export const batchUpdateVideoDetails = async (date, onProgress) => {
  try {
    // 1. 获取该日期的所有视频
    const videos = await getVideos({ date })
    const totalVideos = videos.length
    
    if (totalVideos === 0) {
      throw new Error(`${date} 没有找到任何视频数据`)
    }

    let successCount = 0
    let failedCount = 0
    let skippedCount = 0
    const results = []

    // 2. 逐个更新视频详情
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i]
      const progress = {
        current: i + 1,
        total: totalVideos,
        percentage: Math.round(((i + 1) / totalVideos) * 100),
        currentVideo: video.title || video.bvid
      }

      try {
        // 调用进度回调
        if (onProgress) {
          onProgress({
            ...progress,
            status: 'processing',
            message: `正在检查: ${video.title || video.bvid}`
          })
        }

        // 更新视频详情
        const result = await updateVideoDetail(video.bvid)
        
        // 检查是否跳过
        if (result.skipped) {
          skippedCount++
          results.push({ 
            bvid: video.bvid, 
            success: true, 
            skipped: true, 
            result,
            reason: result.reason 
          })
          
          if (onProgress) {
            onProgress({
              ...progress,
              status: 'skipped',
              message: `已跳过: ${video.title || video.bvid} (${result.reason})`
            })
          }
        } else {
          successCount++
          results.push({ bvid: video.bvid, success: true, result })
          
          if (onProgress) {
            onProgress({
              ...progress,
              status: 'success',
              message: `更新成功: ${video.title || video.bvid}`
            })
          }
        }

        // 添加小延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        failedCount++
        results.push({ 
          bvid: video.bvid, 
          success: false, 
          error: error.message 
        })
        
        // 调用进度回调报告错误
        if (onProgress) {
          onProgress({
            ...progress,
            status: 'error',
            message: `更新失败: ${video.title || video.bvid} - ${error.message}`
          })
        }
      }
    }

    // 3. 返回最终结果
    const finalResult = {
      date,
      totalVideos,
      successCount,
      failedCount,
      skippedCount,
      results
    }

    if (onProgress) {
      onProgress({
        current: totalVideos,
        total: totalVideos,
        percentage: 100,
        status: 'completed',
        message: `批量更新完成！成功: ${successCount}, 跳过: ${skippedCount}, 失败: ${failedCount}`
      })
    }

    return finalResult

  } catch (error) {
    if (onProgress) {
      onProgress({
        status: 'error',
        message: `批量更新失败: ${error.message}`
      })
    }
    throw error
  }
}
