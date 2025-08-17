/**
 * 分页组件
 */
const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalVideos,
  videosPerPage,
  onPageChange 
}) => {
  if (totalVideos <= videosPerPage) {
    return null
  }

  return (
    <div className="stats-and-pagination">
      <div className="video-stats">
        <span className="total-count">当天共有 <strong>{totalVideos}</strong> 个视频</span>
        <span className="current-page-info">
          第 <strong>{currentPage}</strong> 页，共 <strong>{totalPages}</strong> 页
        </span>
      </div>
      
      <div className="pagination">
        <button 
          className="page-btn"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          ⏮️ 首页
        </button>
        
        <button 
          className="page-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ⬅️ 上一页
        </button>
        
        <span className="page-indicator">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            )
          })}
        </span>
        
        <button 
          className="page-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ➡️ 下一页
        </button>
        
        <button 
          className="page-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          ⏭️ 末页
        </button>
      </div>
    </div>
  )
}

export default Pagination
