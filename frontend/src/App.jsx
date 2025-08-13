import { useState, useEffect, Component } from 'react'
import './App.css'

// 错误边界组件
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('错误边界捕获到错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>🚫 出现了一些问题</h2>
          <p>页面遇到了错误，请刷新页面重试。</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            🔄 刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [videos, setVideos] = useState([])
  const [dates, setDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [sortBy, setSortBy] = useState('view_count')
  const [sortOrder, setSortOrder] = useState('desc')
  const [loading, setLoading] = useState(false)
  const [crawlStatus, setCrawlStatus] = useState({ is_crawling: false })
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [totalVideos, setTotalVideos] = useState(0)
  const videosPerPage = 15 // 每页15个视频 (3排 x 5列)

  const API_BASE = 'http://localhost:8000'

  // 获取可用日期
  const fetchDates = async () => {
    try {
      const response = await fetch(`${API_BASE}/dates`)
      const data = await response.json()
      setDates(data.dates)
      if (data.dates.length > 0 && !selectedDate) {
        setSelectedDate(data.dates[0])
      }
    } catch (error) {
      console.error('获取日期失败:', error)
    }
  }

  // 获取视频数据
  const fetchVideos = async () => {
    setLoading(true)
    setIsTransitioning(true)
    
    try {
      const params = new URLSearchParams({
        sort_by: sortBy,
        order: sortOrder
      })
      
      if (selectedDate) {
        params.append('date', selectedDate)
      }

      const response = await fetch(`${API_BASE}/videos?${params}`)
      const data = await response.json()
      
      // 确保数据的完整性，添加默认值
      const processedVideos = (data.videos || []).map(video => {
        return {
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
        }
      })
      
      // 设置总视频数
      setTotalVideos(processedVideos.length)
      
      // 分页处理
      const startIndex = (currentPage - 1) * videosPerPage
      const endIndex = startIndex + videosPerPage
      const paginatedVideos = processedVideos.slice(startIndex, endIndex)
      
      // 延迟设置数据以创建流畅的过渡效果
      setTimeout(() => {
        setVideos(paginatedVideos)
        setIsTransitioning(false)
      }, 300)
      
    } catch (error) {
      console.error('获取视频数据失败:', error)
      setVideos([]) // 设置为空数组而不是保持旧数据
      setIsTransitioning(false)
    } finally {
      setLoading(false)
    }
  }

  // 获取爬虫状态
  const fetchCrawlStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/crawl/status`)
      const data = await response.json()
      setCrawlStatus(data)
    } catch (error) {
      console.error('获取爬虫状态失败:', error)
    }
  }

  // 手动启动爬取
  const startCrawl = async () => {
    try {
      const response = await fetch(`${API_BASE}/crawl/start`, {
        method: 'POST'
      })
      if (response.ok) {
        alert('爬取任务已启动！')
        fetchCrawlStatus()
      } else {
        const error = await response.json()
        alert(`启动失败: ${error.detail}`)
      }
    } catch (error) {
      console.error('启动爬取失败:', error)
      alert('启动爬取失败')
    }
  }

  // 格式化播放量
  const formatViewCount = (count) => {
    if (!count && count !== 0) return '0'
    const num = Number(count)
    if (isNaN(num)) return '0'
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toString()
  }

  // 格式化时间显示
  const formatDateTime = (timeStr) => {
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

  // 格式化在线人数
  const formatOnlineCount = (count) => {
    if (!count && count !== 0) return '0'
    const num = parseInt(count, 10)
    if (isNaN(num)) return '0'
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toString()
  }

  useEffect(() => {
    fetchDates()
    fetchCrawlStatus()
  }, [])

  useEffect(() => {
    if (selectedDate || dates.length > 0) {
      fetchVideos()
    }
  }, [selectedDate, sortBy, sortOrder, currentPage])

  // 当筛选条件改变时重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDate, sortBy, sortOrder])

  // 定期更新爬虫状态
  useEffect(() => {
    const interval = setInterval(fetchCrawlStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app">
      <div className="page-transition">
        <header className="header">
          <div className="header-left">
            <h1>魔理沙的秘密书屋</h1>
            <p className="subtitle">红魔馆的常客</p>
          </div>
          <div className="header-controls">
            <div className="crawl-status">
              <span className={`status-indicator ${crawlStatus.is_crawling ? 'active' : ''}`}>
                {crawlStatus.is_crawling ? '🔄 爬取中...' : '⏸️ 空闲'}
              </span>
              <button 
                onClick={startCrawl} 
                disabled={crawlStatus.is_crawling}
                className="crawl-btn"
              >
                手动爬取
              </button>
            </div>
          </div>
        </header>

      <div className="controls">
        <div className="control-group">
          <label>选择日期</label>
          <div className="select-container">
            <select 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="select"
            >
              {dates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="control-group">
          <label>排序方式</label>
          <div className="select-container">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="select"
            >
              <option value="view_count">播放量</option>
              <option value="online_count">当前在线人数</option>
              <option value="max_online_count">历史最高在线人数</option>
              <option value="title">标题</option>
            </select>
          </div>
        </div>

        <div className="control-group">
          <label>排序顺序</label>
          <div className="select-container">
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className="select"
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>
        </div>
      </div>

      {/* 统计信息和分页控件 */}
      <div className="stats-and-pagination">
        <div className="video-stats">
          <span className="total-count">当天共有 <strong>{totalVideos}</strong> 个视频</span>
          <span className="current-page-info">
            第 <strong>{currentPage}</strong> 页，共 <strong>{Math.ceil(totalVideos / videosPerPage)}</strong> 页
          </span>
        </div>
        
        {totalVideos > videosPerPage && (
          <div className="pagination">
            <button 
              className="page-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              ⏮️ 首页
            </button>
            
            <button 
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ⬅️ 上一页
            </button>
            
            <span className="page-indicator">
              {Array.from({ length: Math.min(5, Math.ceil(totalVideos / videosPerPage)) }, (_, i) => {
                const totalPages = Math.ceil(totalVideos / videosPerPage)
                let pageNum
                
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </span>
            
            <button 
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalVideos / videosPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(totalVideos / videosPerPage)}
            >
              ➡️ 下一页
            </button>
            
            <button 
              className="page-btn"
              onClick={() => setCurrentPage(Math.ceil(totalVideos / videosPerPage))}
              disabled={currentPage === Math.ceil(totalVideos / videosPerPage)}
            >
              ⏭️ 末页
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      ) : (
        <div className={`video-grid ${isTransitioning ? 'transitioning' : ''}`}>
          {videos.map((video, index) => {
            const videoUrl = video.bvid 
              ? `https://www.bilibili.com/video/${video.bvid}`
              : video.aid 
                ? `https://www.bilibili.com/video/av${video.aid}`
                : '#'
            
            return (
              <div 
                key={video.id || index} 
                className="video-card"
                style={{ '--index': index }}
              >
                <div className="card-rank">#{index + 1}</div>
                <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="card-link">
                  <div className="card-image">
                    <img 
                      src={video.pic ? `${API_BASE}/proxy/image?url=${encodeURIComponent(video.pic)}` : ''} 
                      alt={video.title || '无标题'}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOWbvueJhzwvdGV4dD48L3N2Zz4='
                      }}
                    />
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
          })}
        </div>
      )}

      {videos.length === 0 && !loading && (
        <div className="empty-state">
          <p>📺 暂无视频数据</p>
          <p>请等待爬虫收集数据或手动启动爬取</p>
        </div>
      )}
      </div>
    </div>
  )
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}
