import { useState, useEffect, useCallback } from 'react'
import { getDates, getVideos, getCrawlStatus, startCrawl, getZoneStats } from '../services/api.js'

/**
 * 管理可用日期的Hook
 */
export const useDates = () => {
  const [dates, setDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')

  const fetchDates = useCallback(async () => {
    try {
      const datesList = await getDates()
      setDates(datesList)
      if (datesList.length > 0 && !selectedDate) {
        setSelectedDate(datesList[0])
      }
    } catch (error) {
      console.error('获取日期失败:', error)
      setDates([])
    }
  }, [selectedDate])

  useEffect(() => {
    fetchDates()
  }, [fetchDates])

  return {
    dates,
    selectedDate,
    setSelectedDate
  }
}

/**
 * 管理视频数据的Hook
 */
export const useVideos = (selectedDate, sortBy, sortOrder, currentPage, videosPerPage = 15, mainZone = '', subZone = '', searchTerm = '') => {
  const [videos, setVideos] = useState([])
  const [totalVideos, setTotalVideos] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    setIsTransitioning(true)
    
    try {
      const allVideos = await getVideos({
        date: selectedDate,
        sortBy,
        order: sortOrder,
        mainZone,
        subZone
      })
      
      // 如果有搜索词，进行客户端搜索过滤
      let filteredVideos = allVideos
      if (searchTerm && searchTerm.trim().length > 0) {
        const searchTermLower = searchTerm.trim().toLowerCase()
        filteredVideos = allVideos.filter(video => 
          video.title && video.title.toLowerCase().includes(searchTermLower)
        )
      }
      
      // 设置总视频数
      setTotalVideos(filteredVideos.length)
      
      // 分页处理
      const startIndex = (currentPage - 1) * videosPerPage
      const endIndex = startIndex + videosPerPage
      const paginatedVideos = filteredVideos.slice(startIndex, endIndex)
      
      // 延迟设置数据以创建流畅的过渡效果
      setTimeout(() => {
        setVideos(paginatedVideos)
        setIsTransitioning(false)
      }, 300)
      
    } catch (error) {
      console.error('获取视频数据失败:', error)
      setVideos([])
      setIsTransitioning(false)
    } finally {
      setLoading(false)
    }
  }, [selectedDate, sortBy, sortOrder, mainZone, subZone, currentPage, videosPerPage, searchTerm])

  useEffect(() => {
    if (selectedDate) {
      fetchVideos()
    }
  }, [selectedDate, sortBy, sortOrder, currentPage, mainZone, subZone, searchTerm, fetchVideos])

  return {
    videos,
    totalVideos,
    loading,
    isTransitioning,
    refetch: fetchVideos
  }
}

/**
 * 管理爬虫状态的Hook
 */
export const useCrawlStatus = () => {
  const [crawlStatus, setCrawlStatus] = useState({ is_crawling: false })

  const fetchCrawlStatus = async () => {
    try {
      const status = await getCrawlStatus()
      setCrawlStatus(status)
    } catch (error) {
      console.error('获取爬虫状态失败:', error)
      setCrawlStatus({ is_crawling: false })
    }
  }

  const handleStartCrawl = async () => {
    try {
      await startCrawl()
      alert('爬取任务已启动！')
      fetchCrawlStatus()
      return true
    } catch (error) {
      console.error('启动爬取失败:', error)
      alert(`启动失败: ${error.message}`)
      return false
    }
  }

  useEffect(() => {
    fetchCrawlStatus()
    
    // 定期更新爬虫状态
    const interval = setInterval(fetchCrawlStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return {
    crawlStatus,
    startCrawl: handleStartCrawl,
    refetch: fetchCrawlStatus
  }
}

/**
 * 管理分页的Hook
 */
export const usePagination = (totalItems, itemsPerPage = 15) => {
  const [currentPage, setCurrentPage] = useState(1)
  
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // 当总数变化时重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [totalItems])

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPrevPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

  return {
    currentPage,
    totalPages,
    setCurrentPage,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToPrevPage,
    goToNextPage
  }
}

/**
 * 管理分区统计数据的Hook
 */
export const useZoneStats = (selectedDate) => {
  const [zoneStats, setZoneStats] = useState({})
  const [loading, setLoading] = useState(false)

  const fetchZoneStats = useCallback(async () => {
    setLoading(true)
    try {
      const stats = await getZoneStats(selectedDate)
      setZoneStats(stats)
    } catch (error) {
      console.error('获取分区统计失败:', error)
      setZoneStats({})
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchZoneStats()
  }, [selectedDate, fetchZoneStats])

  return {
    zoneStats,
    loading,
    refetch: fetchZoneStats
  }
}
