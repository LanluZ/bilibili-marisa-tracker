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
