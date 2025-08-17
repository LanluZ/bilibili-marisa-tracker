import { formatViewCount } from '../utils/formatters.js'

/**
 * 视频详情卡片组件
 */
const VideoDetailCard = ({ videoDetail, loading, error, onClose }) => {
  if (loading) {
    return (
      <div className="video-detail-card">
        <div className="video-detail-header">
          <h3>加载中...</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="video-detail-loading">
          <div className="spinner"></div>
          <p>正在获取视频详情...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="video-detail-card">
        <div className="video-detail-header">
          <h3>获取失败</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="video-detail-error">
          <p>❌ {error}</p>
          <p>可能是网络问题或视频已被删除</p>
        </div>
      </div>
    )
  }

  if (!videoDetail) {
    return null
  }

  return (
    <div className="video-detail-card">
      <div className="video-detail-header">
        <h3>视频详情</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      <div className="video-detail-content">
        {/* 基本信息 */}
        <div className="detail-section">
          <h4>基本信息</h4>
          <div className="detail-item">
            <span className="detail-label">标题:</span>
            <span className="detail-value" title={videoDetail.title}>{videoDetail.title}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">AV号:</span>
            <span className="detail-value">av{videoDetail.aid}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">BV号:</span>
            <span className="detail-value">{videoDetail.bvid}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">分P数:</span>
            <span className="detail-value">{videoDetail.videos}P</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">时长:</span>
            <span className="detail-value">{videoDetail.duration}</span>
          </div>
        </div>

        {/* 分区信息 */}
        <div className="detail-section">
          <h4>分区信息</h4>
          <div className="detail-item">
            <span className="detail-label">分区ID:</span>
            <span className="detail-value">{videoDetail.tid}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">分区ID(v2):</span>
            <span className="detail-value">{videoDetail.tid_v2}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">分区名:</span>
            <span className="detail-value">{videoDetail.tname}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">分区名(v2):</span>
            <span className="detail-value">{videoDetail.tname_v2}</span>
          </div>
        </div>

        {/* 时间信息 */}
        <div className="detail-section">
          <h4>时间信息</h4>
          <div className="detail-item">
            <span className="detail-label">发布时间:</span>
            <span className="detail-value">{videoDetail.pubdate}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">投稿时间:</span>
            <span className="detail-value">{videoDetail.ctime}</span>
          </div>
        </div>

        {/* UP主信息 */}
        <div className="detail-section">
          <h4>UP主信息</h4>
          <div className="up-info">
            <img 
              src={videoDetail.owner.face} 
              alt={videoDetail.owner.name}
              className="up-avatar"
              onError={(e) => e.target.style.display = 'none'}
            />
            <div className="up-details">
              <div className="detail-item">
                <span className="detail-label">昵称:</span>
                <span className="detail-value">{videoDetail.owner.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">UID:</span>
                <span className="detail-value">{videoDetail.owner.mid}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="detail-section">
          <h4>统计信息</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{formatViewCount(videoDetail.stat.view)}</span>
              <span className="stat-label">播放</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatViewCount(videoDetail.stat.like)}</span>
              <span className="stat-label">点赞</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatViewCount(videoDetail.stat.coin)}</span>
              <span className="stat-label">投币</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatViewCount(videoDetail.stat.favorite)}</span>
              <span className="stat-label">收藏</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatViewCount(videoDetail.stat.share)}</span>
              <span className="stat-label">分享</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatViewCount(videoDetail.stat.reply)}</span>
              <span className="stat-label">评论</span>
            </div>
          </div>
        </div>

        {/* 视频简介 */}
        {videoDetail.desc && (
          <div className="detail-section">
            <h4>视频简介</h4>
            <div className="detail-desc">
              {videoDetail.desc}
            </div>
          </div>
        )}

        {/* 分P信息 */}
        {videoDetail.pages && videoDetail.pages.length > 1 && (
          <div className="detail-section">
            <h4>分P信息</h4>
            <div className="pages-list">
              {videoDetail.pages.map((page, index) => (
                <div key={page.cid} className="page-item">
                  <span className="page-number">P{page.page}</span>
                  <span className="page-title">{page.part}</span>
                  <span className="page-duration">{formatDuration(page.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 格式化时长
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

export default VideoDetailCard
