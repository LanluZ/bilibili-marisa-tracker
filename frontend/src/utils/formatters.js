/**
 * 格式化播放量
 * @param {number|string} count 播放量
 * @returns {string} 格式化后的播放量
 */
export const formatViewCount = (count) => {
  if (!count && count !== 0) return '0'
  const num = Number(count)
  if (isNaN(num)) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

/**
 * 格式化时间显示
 * @param {string} timeStr 时间字符串
 * @returns {string} 格式化后的时间
 */
export const formatDateTime = (timeStr) => {
  if (!timeStr) return '未知时间'
  try {
    // 处理多种时间格式
    let date
    if (timeStr.includes('T')) {
      // ISO格式: 2025-08-13T16:16:38.808406
      date = new Date(timeStr)
    } else {
      // SQL格式: 2025-08-13 08:16:38
      date = new Date(timeStr.replace(' ', 'T'))
    }
    
    if (isNaN(date.getTime())) {
      return timeStr // 如果无法解析，直接返回原字符串
    }
    
    return date.toLocaleString('zh-CN')
  } catch (error) {
    console.warn('时间格式解析失败:', timeStr, error)
    return timeStr
  }
}

/**
 * 格式化在线人数
 * @param {number|string} count 在线人数
 * @returns {string} 格式化后的在线人数
 */
export const formatOnlineCount = (count) => {
  if (!count && count !== 0) return '0'
  const num = parseInt(count, 10)
  if (isNaN(num)) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}
