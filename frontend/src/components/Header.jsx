/**
 * 页头组件
 */
const Header = ({ crawlStatus, onStartCrawl }) => {
  return (
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
            onClick={onStartCrawl} 
            disabled={crawlStatus.is_crawling}
            className="crawl-btn"
          >
            手动爬取
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
