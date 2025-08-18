import { useState, useEffect } from 'react'
import { getDates, batchUpdateVideoDetails } from '../services/api'
import DatePicker from './DatePicker'

/**
 * 侧边栏组件
 */
const Sidebar = ({ 
  isOpen, 
  onToggle, 
  totalVideos, 
  currentPage, 
  totalPages, 
  crawlStatus,
  onStartCrawl
}) => {
  const [updateStatus, setUpdateStatus] = useState({
    isUpdating: false,
    selectedDate: '',
    progress: null,
    lastResult: null
  })
  const [availableDates, setAvailableDates] = useState([])

  // 加载可用日期
  useEffect(() => {
    const loadDates = async () => {
      try {
        const dates = await getDates()
        setAvailableDates(dates)
        if (dates.length > 0) {
          setUpdateStatus(prev => ({ ...prev, selectedDate: dates[0] }))
        }
      } catch (error) {
        console.error('加载日期失败:', error)
      }
    }
    loadDates()
  }, [])

  // 启动批量更新
  const handleBatchUpdate = async () => {
    if (!updateStatus.selectedDate) {
      alert('请选择一个日期')
      return
    }

    setUpdateStatus(prev => ({
      ...prev,
      isUpdating: true,
      progress: { percentage: 0, message: '准备开始...' },
      lastResult: null
    }))

    try {
      const result = await batchUpdateVideoDetails(
        updateStatus.selectedDate,
        (progress) => {
          setUpdateStatus(prev => ({ ...prev, progress }))
        }
      )

      setUpdateStatus(prev => ({
        ...prev,
        isUpdating: false,
        progress: null,
        lastResult: result
      }))

    } catch (error) {
      setUpdateStatus(prev => ({
        ...prev,
        isUpdating: false,
        progress: { status: 'error', message: error.message }
      }))
      
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, progress: null }))
      }, 5000)
    }
  }
  return (
    <>
      {/* 侧边栏切换按钮 */}
      <button 
        className="sidebar-toggle"
        onClick={onToggle}
        title="打开侧边栏"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* 侧边栏 */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">项目信息</h2>
          <p className="sidebar-subtitle">魔理沙的秘密书屋</p>
        </div>
        
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">
              <span></span>
              相关链接
            </h3>
            <div className="sidebar-links">
              <a 
                href="https://github.com/LanluZ/bilibili-marisa-tracker" 
                target="_blank" 
                rel="noopener noreferrer"
                className="sidebar-link"
              >
                <span className="sidebar-link-icon">⭐</span>
                <span className="sidebar-link-text">GitHub 仓库</span>
                <span className="sidebar-link-external">↗</span>
              </a>
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-section-title">
              <span></span>
              爬取任务
            </h3>
            <div className="crawl-control">
              <div className="crawl-status-display">
                <span className={`status-indicator ${crawlStatus.is_crawling ? 'active' : ''}`}>
                  {crawlStatus.is_crawling ? '🔄 爬取中...' : '⏸️ 空闲'}
                </span>
              </div>
              <button 
                onClick={onStartCrawl} 
                disabled={crawlStatus.is_crawling}
                className="crawl-btn sidebar-crawl-btn"
                title={crawlStatus.is_crawling ? '爬取正在进行中' : '手动启动爬取任务'}
              >
                {crawlStatus.is_crawling ? '⏳ 爬取中...' : '🚀 启动爬取'}
              </button>
            </div>
          </div>

          <div className="sidebar-section batch-update-section">
            <h3 className="sidebar-section-title">
              <span></span>
              详细分区获取
            </h3>
            <div className="batch-update-control">
              <div className="date-selector">
                <label className="date-selector-label">选择日期:</label>
                <DatePicker
                  dates={availableDates || []}
                  selectedDate={updateStatus.selectedDate}
                  onDateChange={(date) => setUpdateStatus(prev => ({ ...prev, selectedDate: date }))}
                  disabled={updateStatus.isUpdating}
                />
              </div>
              
              <button 
                onClick={handleBatchUpdate}
                disabled={updateStatus.isUpdating || !updateStatus.selectedDate}
                className="batch-update-btn"
                title="批量获取该日期所有视频的详细分区信息"
              >
                {updateStatus.isUpdating ? '📡 获取中...' : '📋 获取分区信息'}
              </button>

              {/* 进度显示 */}
              {updateStatus.progress && (
                <div className="update-progress">
                  {updateStatus.progress.percentage !== undefined && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${updateStatus.progress.percentage}%` }}
                      ></div>
                      <span className="progress-text">{updateStatus.progress.percentage}%</span>
                    </div>
                  )}
                  <div className={`progress-message ${updateStatus.progress.status || ''}`}>
                    {updateStatus.progress.message}
                  </div>
                </div>
              )}

              {/* 结果显示 */}
              {updateStatus.lastResult && (
                <div className="update-result">
                  <div className="result-summary">
                    <div className="result-item success">
                      <span className="result-label">成功:</span>
                      <span className="result-value">{updateStatus.lastResult.successCount}</span>
                    </div>
                    {updateStatus.lastResult.skippedCount > 0 && (
                      <div className="result-item skipped">
                        <span className="result-label">跳过:</span>
                        <span className="result-value">{updateStatus.lastResult.skippedCount}</span>
                      </div>
                    )}
                    <div className="result-item failed">
                      <span className="result-label">失败:</span>
                      <span className="result-value">{updateStatus.lastResult.failedCount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-section-title">
              <span></span>
              数据统计
            </h3>
            <div className="sidebar-stats">
              <div className="sidebar-stats-title">
                <span></span>
                实时统计
              </div>
              <div className="sidebar-stats-item">
                <span className="sidebar-stats-label">总视频数:</span>
                <span className="sidebar-stats-value">{totalVideos}</span>
              </div>
              <div className="sidebar-stats-item">
                <span className="sidebar-stats-label">当前页:</span>
                <span className="sidebar-stats-value">{currentPage}</span>
              </div>
              <div className="sidebar-stats-item">
                <span className="sidebar-stats-label">总页数:</span>
                <span className="sidebar-stats-value">{totalPages}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">
            © 2025 魔理沙的秘密书屋
          </p>
        </div>
      </div>
    </>
  )
}

export default Sidebar
