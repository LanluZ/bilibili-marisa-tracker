// Videos功能模块 - 视频列表Hook
import { useState, useEffect, useCallback } from 'react'
import { VideosFeatureService } from '../services'
import { useDebounce } from '../../../shared/hooks/common'

/**
 * 视频列表功能Hook
 * @param {Object} initialFilters - 初始过滤条件
 * @returns {Object} 视频列表状态和操作方法
 */
export const useVideoList = (initialFilters = {}) => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    size: 15,
    totalItems: 0
  })
  
  const [filters, setFilters] = useState({
    date: '',
    sortBy: 'view_count',
    sortOrder: 'desc',
    zone: '',
    searchKeyword: '',
    ...initialFilters
  })

  // 搜索关键词防抖
  const debouncedSearchKeyword = useDebounce(filters.searchKeyword, 300)

  /**
   * 加载视频列表
   */
  const loadVideos = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const mergedParams = { ...filters, ...params }
      
      let result
      if (debouncedSearchKeyword.trim()) {
        // 搜索模式
        const searchResults = await VideosFeatureService.searchVideos(
          debouncedSearchKeyword,
          { 
            date: mergedParams.date,
            zone: mergedParams.zone
          }
        )
        
        // 手动分页搜索结果
        const startIndex = (mergedParams.page - 1) * mergedParams.limit
        const endIndex = startIndex + mergedParams.limit
        const paginatedResults = searchResults.slice(startIndex, endIndex)
        
        result = {
          videos: paginatedResults,
          pagination: {
            current: mergedParams.page || 1,
            total: Math.ceil(searchResults.length / (mergedParams.limit || 15)),
            size: mergedParams.limit || 15,
            totalItems: searchResults.length
          }
        }
      } else {
        // 普通列表模式
        result = await VideosFeatureService.getVideosWithPagination(mergedParams)
      }
      
      setVideos(result.videos)
      setPagination(result.pagination)
    } catch (err) {
      setError(err.message)
      setVideos([])
      setPagination({ current: 1, total: 0, size: 15, totalItems: 0 })
    } finally {
      setLoading(false)
    }
  }, [filters, debouncedSearchKeyword])

  /**
   * 更新过滤条件
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ 
      ...prev, 
      ...newFilters,
      page: newFilters.page || 1 // 重置页码，除非明确指定
    }))
  }, [])

  /**
   * 跳转到指定页
   */
  const goToPage = useCallback((page) => {
    updateFilters({ page })
  }, [updateFilters])

  /**
   * 刷新当前页
   */
  const refresh = useCallback(() => {
    loadVideos()
  }, [loadVideos])

  /**
   * 重置过滤条件
   */
  const reset = useCallback(() => {
    setFilters({
      date: '',
      sortBy: 'view_count',
      sortOrder: 'desc',
      zone: '',
      searchKeyword: '',
      page: 1,
      limit: 15
    })
  }, [])

  // 当过滤条件变化时自动加载数据
  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  return {
    // 状态
    videos,
    loading,
    error,
    pagination,
    filters,
    
    // 操作方法
    updateFilters,
    goToPage,
    refresh,
    reset,
    
    // 辅助信息
    hasData: videos.length > 0,
    isEmpty: !loading && videos.length === 0,
    isSearching: !!debouncedSearchKeyword.trim()
  }
}
