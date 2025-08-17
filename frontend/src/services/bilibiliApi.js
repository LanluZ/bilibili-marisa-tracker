/**
 * bilibili API 服务 - 获取视频详细信息
 */

/**
 * 获取视频详细信息 - 通过后端代理
 * @param {string} bvid - 视频的bvid
 * @param {string} aid - 视频的aid (可选，与bvid二选一)
 * @returns {Promise<Object>} 视频详细信息
 */
export const getVideoDetail = async (bvid, aid = null) => {
  try {
    const params = new URLSearchParams()
    
    if (bvid) {
      params.append('bvid', bvid)
    } else if (aid) {
      params.append('aid', aid)
    } else {
      throw new Error('bvid或aid至少需要提供一个')
    }

    const response = await fetch(`/api/video/detail?${params}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('获取视频详细信息失败:', error)
    throw error
  }
}

/**
 * 格式化视频详细信息用于显示
 * @param {Object} videoDetail - API返回的视频详细信息
 * @returns {Object} 格式化后的视频信息
 */
export const formatVideoDetail = (videoDetail) => {
  if (!videoDetail) return null

  return {
    // 基本信息
    aid: videoDetail.aid,
    bvid: videoDetail.bvid,
    title: videoDetail.title,
    pic: videoDetail.pic,
    
    // 分区信息
    tid: videoDetail.tid,
    tid_v2: videoDetail.tid_v2,
    tname: videoDetail.tname,
    tname_v2: videoDetail.tname_v2,
    
    // 时间信息
    pubdate: new Date(videoDetail.pubdate * 1000).toLocaleString('zh-CN'),
    ctime: new Date(videoDetail.ctime * 1000).toLocaleString('zh-CN'),
    duration: formatDuration(videoDetail.duration),
    
    // 视频内容
    desc: videoDetail.desc,
    videos: videoDetail.videos, // 分P数
    
    // UP主信息
    owner: {
      mid: videoDetail.owner?.mid,
      name: videoDetail.owner?.name,
      face: videoDetail.owner?.face
    },
    
    // 统计信息
    stat: {
      view: videoDetail.stat?.view,
      danmaku: videoDetail.stat?.danmaku,
      reply: videoDetail.stat?.reply,
      favorite: videoDetail.stat?.favorite,
      coin: videoDetail.stat?.coin,
      share: videoDetail.stat?.share,
      like: videoDetail.stat?.like
    },
    
    // 分P信息
    pages: videoDetail.pages || [],
    
    // 权限信息
    rights: videoDetail.rights || {}
  }
}

/**
 * 格式化时长
 * @param {number} duration - 时长(秒)
 * @returns {string} 格式化后的时长
 */
const formatDuration = (duration) => {
  if (!duration) return '0:00'
  
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = duration % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}
