import { useState, useEffect } from 'react'
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
import { useDates, useVideos, useCrawlStatus, usePagination, useZoneStats } from './hooks/useData.js'
import { useSidebar } from './hooks/useSidebar.js'
import { useVideoDetail } from './hooks/useVideoDetail.js'

// 导入设备检测工具
import { addDeviceClassToBody } from './utils/deviceDetection.js'

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
  
  // 分区筛选状态
  const [zoneFilter, setZoneFilter] = useState({
    mainZone: '',
    subZone: '',
    mainZoneName: '',
    subZoneName: ''
  })
  
  const videosPerPage = 15 // 每页15个视频

  // 使用自定义Hooks
  const { dates, selectedDate, setSelectedDate } = useDates()
  const { crawlStatus, startCrawl } = useCrawlStatus()
  const { sidebarOpen, toggleSidebar } = useSidebar()
  const { zoneStats } = useZoneStats(selectedDate)
  
  // 临时状态用于分页
  const [currentPage, setCurrentPage] = useState(1)
  
  const { videos, totalVideos, loading, isTransitioning } = useVideos(
    selectedDate, 
    sortBy, 
    sortOrder, 
    currentPage, 
    videosPerPage,
    zoneFilter.mainZone,
    zoneFilter.subZone
  )
  
  // 计算总页数
  const totalPages = Math.ceil(totalVideos / videosPerPage)
  
  // 视频详情相关
  const { videoDetail, loading: detailLoading, error: detailError, fetchVideoDetail, clearVideoDetail } = useVideoDetail()

  // 当筛选条件改变时重置到第一页
  const handleFiltersChange = (newSortBy, newSortOrder, newSelectedDate, newZoneFilter) => {
    if (newSortBy !== undefined) setSortBy(newSortBy)
    if (newSortOrder !== undefined) setSortOrder(newSortOrder)
    if (newSelectedDate !== undefined) setSelectedDate(newSelectedDate)
    if (newZoneFilter !== undefined) setZoneFilter(newZoneFilter)
    setCurrentPage(1)
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
        onStartCrawl={startCrawl}
      />

      <div className="page-transition">
        <Header />

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
