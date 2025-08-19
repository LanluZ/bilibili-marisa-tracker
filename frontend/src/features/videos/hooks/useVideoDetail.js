import { useState, useCallback } from 'react'
import { getVideoDetail, formatVideoDetail } from '../services/bilibiliApi.js'

/**
 * 管理视频详情的Hook
 */
export const useVideoDetail = () => {
  const [videoDetail, setVideoDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchVideoDetail = useCallback(async (bvid, aid = null) => {
    setLoading(true)
    setError(null)
    
    try {
      const detail = await getVideoDetail(bvid, aid)
      const formattedDetail = formatVideoDetail(detail)
      setVideoDetail(formattedDetail)
      return formattedDetail
    } catch (err) {
      setError(err.message)
      setVideoDetail(null)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearVideoDetail = useCallback(() => {
    setVideoDetail(null)
    setError(null)
  }, [])

  return {
    videoDetail,
    loading,
    error,
    fetchVideoDetail,
    clearVideoDetail
  }
}
