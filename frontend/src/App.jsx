import { useState } from 'react'
import './App.css'

// 导入组件
import {
  ErrorBoundary,
  Sidebar,
  Header,
  Controls,
  Pagination,
  VideoGrid
} from './components/index.js'

// 导入自定义Hooks
import { useDates, useVideos, useCrawlStatus } from './hooks/useData.js'
import { useSidebar } from './hooks/useSidebar.js'

function App() {
  // 排序状态
  const [sortBy, setSortBy] = useState('view_count')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const videosPerPage = 15 // 每页15个视频

  // 使用自定义Hooks
  const { dates, selectedDate, setSelectedDate } = useDates()
  const { videos, totalVideos, loading, isTransitioning } = useVideos(
    selectedDate, 
    sortBy, 
    sortOrder, 
    currentPage, 
    videosPerPage
  )
  const { crawlStatus, startCrawl } = useCrawlStatus()
  const { sidebarOpen, toggleSidebar } = useSidebar()

  // 计算总页数
  const totalPages = Math.ceil(totalVideos / videosPerPage)

  // 当筛选条件改变时重置到第一页
  const handleFiltersChange = (newSortBy, newSortOrder, newSelectedDate) => {
    if (newSortBy !== undefined) setSortBy(newSortBy)
    if (newSortOrder !== undefined) setSortOrder(newSortOrder)
    if (newSelectedDate !== undefined) setSelectedDate(newSelectedDate)
    setCurrentPage(1)
  }

  return (
    <div className="app">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        totalVideos={totalVideos}
        currentPage={currentPage}
        totalPages={totalPages}
        crawlStatus={crawlStatus}
      />

      <div className="page-transition">
        <Header 
          crawlStatus={crawlStatus}
          onStartCrawl={startCrawl}
        />

        <Controls
          dates={dates}
          selectedDate={selectedDate}
          onDateChange={(date) => handleFiltersChange(undefined, undefined, date)}
          sortBy={sortBy}
          onSortByChange={(sort) => handleFiltersChange(sort, undefined, undefined)}
          sortOrder={sortOrder}
          onSortOrderChange={(order) => handleFiltersChange(undefined, order, undefined)}
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
