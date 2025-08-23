import { useState, useEffect, useRef } from 'react'
import './App.css'

// 导入组件
import {
  ErrorBoundary,
  Sidebar,
  Header,
  Controls,
  Pagination,
  VideoGrid,
  VideoDetailPanel
} from './components/index.js'

// 导入自定义Hooks
import { useDates, useVideos, useCrawlStatus, useZoneStats } from './hooks/useData.js'
import { useSidebar } from './hooks/useSidebar.js'
import { useVideoDetail } from './hooks/useVideoDetail.js'

// 导入设备检测工具
import { addDeviceClassToBody } from './utils/deviceDetection.js'

// 导入常量
import { PAGINATION } from './shared/constants/app.js'

function App() {
  // 设备检测
  useEffect(() => {
    addDeviceClassToBody()
    
    // 监听窗口大小变化，重新检测设备类型
    const handleResize = () => {
      addDeviceClassToBody()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  // 排序状态
  const [sortBy, setSortBy] = useState('view_count')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('')
  
  // 分区筛选状态
  const [zoneFilter, setZoneFilter] = useState({
    mainZone: '',
    subZone: '',
    mainZoneName: '',
    subZoneName: ''
  })
  
  const videosPerPage = PAGINATION.VIDEOS_PER_PAGE

  // 使用自定义Hooks
  const { dates, selectedDate, setSelectedDate } = useDates()
  const { crawlStatus, startCrawl } = useCrawlStatus()
  const { sidebarOpen, toggleSidebar } = useSidebar()
  const { zoneStats, refetch: refetchZoneStats } = useZoneStats(selectedDate)
  
  // 使用 useRef 跟踪前一个爬虫状态
  const prevCrawlingRef = useRef(false)
  
  // 监听爬虫状态变化，在爬取完成后自动刷新分区统计
  useEffect(() => {
    // 如果爬虫从正在运行变为停止，则刷新分区统计
    if (prevCrawlingRef.current && !crawlStatus.is_crawling) {
      refetchZoneStats()
    }
    prevCrawlingRef.current = crawlStatus.is_crawling
  }, [crawlStatus.is_crawling, refetchZoneStats])

  // 增强的开始爬取函数，完成后自动刷新分区统计
  const handleStartCrawl = async () => {
    const success = await startCrawl()
    if (success) {
      // 爬取启动成功后，等待一段时间再刷新统计
      setTimeout(() => {
        refetchZoneStats()
      }, 2000)
    }
  }
  
  // 临时状态用于分页
  const [currentPage, setCurrentPage] = useState(1)
  
  const { videos, totalVideos, loading, isTransitioning } = useVideos(
    selectedDate, 
    sortBy, 
    sortOrder, 
    currentPage, 
    videosPerPage,
    zoneFilter.mainZone,
    zoneFilter.subZone,
    searchTerm
  )
  
  // 计算总页数
  const totalPages = Math.ceil(totalVideos / videosPerPage)
  
  // 视频详情相关
  const { videoDetail, loading: detailLoading, error: detailError, fetchVideoDetail, clearVideoDetail } = useVideoDetail()

  // 当筛选条件改变时重置到第一页
  const handleFiltersChange = (newSortBy, newSortOrder, newSelectedDate, newZoneFilter, newSearchTerm) => {
    if (newSortBy !== undefined) setSortBy(newSortBy)
    if (newSortOrder !== undefined) setSortOrder(newSortOrder)
    if (newSelectedDate !== undefined) setSelectedDate(newSelectedDate)
    if (newZoneFilter !== undefined) setZoneFilter(newZoneFilter)
    if (newSearchTerm !== undefined) setSearchTerm(newSearchTerm)
    setCurrentPage(1)
  }

  // 处理搜索
  const handleSearch = (term) => {
    handleFiltersChange(undefined, undefined, undefined, undefined, term)
  }

  // 处理分区筛选变化
  const handleZoneFilterChange = (filter) => {
    handleFiltersChange(undefined, undefined, undefined, filter)
  }

  // 处理显示视频详情
  const handleShowVideoDetail = async (bvid, aid) => {
    try {
      await fetchVideoDetail(bvid, aid)
      // 不需要自动打开侧边栏，视频详情面板是独立的
    } catch (error) {
      console.error('获取视频详情失败:', error)
    }
  }

  return (
    <div className="app">
      {/* 独立的视频详情面板 */}
      <VideoDetailPanel
        isVisible={!!(videoDetail || detailLoading || detailError)}
        videoDetail={videoDetail}
        loading={detailLoading}
        error={detailError}
        onClose={clearVideoDetail}
        sidebarOpen={sidebarOpen}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        totalVideos={totalVideos}
        currentPage={currentPage}
        totalPages={totalPages}
        crawlStatus={crawlStatus}
        onStartCrawl={handleStartCrawl}
      />

      <div className="page-transition">
        <Header onSearch={handleSearch} />

        <Controls
          dates={dates}
          selectedDate={selectedDate}
          onDateChange={(date) => handleFiltersChange(undefined, undefined, date, undefined)}
          sortBy={sortBy}
          onSortByChange={(sort) => handleFiltersChange(sort, undefined, undefined, undefined)}
          sortOrder={sortOrder}
          onSortOrderChange={(order) => handleFiltersChange(undefined, order, undefined, undefined)}
          zoneFilter={zoneFilter}
          onZoneFilterChange={handleZoneFilterChange}
          zoneStats={zoneStats}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalVideos={totalVideos}
          videosPerPage={videosPerPage}
          onPageChange={setCurrentPage}
        />

        <VideoGrid
          videos={videos}
          loading={loading}
          isTransitioning={isTransitioning}
          onShowDetail={handleShowVideoDetail}
        />
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
