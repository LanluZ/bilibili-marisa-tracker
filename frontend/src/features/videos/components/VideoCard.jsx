import { formatViewCount, formatOnlineCount, formatDateTime } from '../utils/formatters.js'
import { useEffect, useState, useCallback } from 'react'
import { shouldUseMobileUI } from '../utils/deviceDetection.js'
import { API_CONFIG } from '../shared/constants/app.js'

/**
 * 视频卡片组件
 * @param {import('../shared/types/index.js').VideoCardProps} props
 */
const VideoCard = ({ video, index, onShowDetail }) => {
  const [isMobile, setIsMobile] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(shouldUseMobileUI())
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => {
      window.removeEventListener('resize', checkDevice)
    }
  }, [])

  // 生成视频链接
  const videoUrl = video.bvid 
    ? `https://www.bilibili.com/video/${video.bvid}`
    : video.aid 
      ? `https://www.bilibili.com/video/av${video.aid}`
      : '#'

  // 处理图片加载错误
  const handleImageError = useCallback((e) => {
    if (!imageError) {
      setImageError(true)
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOWbvueJhzwvdGV4dD48L3N2Zz4='
    }
  }, [imageError])

  // 处理显示详情
  const handleShowDetail = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    onShowDetail?.(video.bvid, video.aid)
  }, [video.bvid, video.aid, onShowDetail])

  // 生成图片URL
  const imageUrl = video.pic && !imageError 
    ? `${API_CONFIG.ENDPOINTS.PROXY_IMAGE}?url=${encodeURIComponent(video.pic)}` 
    : null

  return (
    <div className="video-card">
      <div className="card-rank">#{index + 1}</div>
      
      {/* 三点按钮 */}
      <button 
        className={`video-detail-btn ${isMobile ? 'mobile-visible' : ''}`}
        onClick={handleShowDetail}
        title="查看视频详情"
      >
        ⋯
      </button>
      
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="card-link">
        <div className="card-image">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={video.title || '无标题'}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="image-placeholder">
              <span>🎬</span>
            </div>
          )}
          <div className="play-overlay">
            <div className="play-icon">▶️</div>
          </div>
        </div>
      </a>
      
      <div className="card-content">
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="title-link">
          <h3 className="card-title" title={video.title || '无标题'}>
            {video.title || '无标题'}
          </h3>
        </a>
        
        <div className="card-stats">
          <div className="stat-item">
            <span className="stat-icon">🔴</span>
            <span className="stat-value">{formatViewCount(video.view_count)}</span>
            <span className="stat-label">播放</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🔴</span>
            <span className="stat-value">{formatOnlineCount(video.online_count)}</span>
            <span className="stat-label">当前在线</span>
          </div>
          <div className="stat-item max-online">
            <span className="stat-icon">🔴</span>
            <span className="stat-value">{formatOnlineCount(video.max_online_count)}</span>
            <span className="stat-label">最高在线</span>
          </div>
        </div>
        
        {video.max_online_time && (
          <div className="max-online-info">
            <span className="max-online-icon">⏰</span>
            <span className="max-online-label">最高记录时间:</span>
            <span className="max-online-time">
              {formatDateTime(video.max_online_time)}
            </span>
          </div>
        )}
        
        <div className="card-meta">
          <div className="update-time">
            <span className="update-icon">🕒</span>
            <span className="update-label">数据更新:</span>
            <span className="update-value">
              {formatDateTime(video.crawl_time)}
            </span>
          </div>
        </div>
        
        <div className="card-footer">
          <span className="bvid">{video.bvid || `av${video.aid}` || '无ID'}</span>
          <span className="crawl-date">{video.crawl_date || '未知日期'}</span>
        </div>
      </div>
    </div>
  )
}

export default VideoCard
