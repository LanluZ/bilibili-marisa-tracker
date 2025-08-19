import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 防抖Hook
 * @param {*} value - 需要防抖的值
 * @param {number} delay - 延迟时间(毫秒)
 * @returns {*} 防抖后的值
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 节流Hook
 * @param {Function} callback - 回调函数
 * @param {number} delay - 延迟时间(毫秒)
 * @returns {Function} 节流后的函数
 */
export const useThrottle = (callback, delay) => {
  const lastCall = useRef(0)
  
  return useCallback((...args) => {
    const now = Date.now()
    if (now - lastCall.current >= delay) {
      lastCall.current = now
      callback(...args)
    }
  }, [callback, delay])
}

/**
 * 本地存储Hook
 * @param {string} key - 存储键名
 * @param {*} initialValue - 初始值
 * @returns {[*, Function]} [值, 设置函数]
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key])

  return [storedValue, setValue]
}

/**
 * 异步状态Hook
 * @param {Function} asyncFunction - 异步函数
 * @param {*} initialValue - 初始值
 * @returns {Object} {data, loading, error, execute}
 */
export const useAsync = (asyncFunction, initialValue = null) => {
  const [data, setData] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await asyncFunction(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [asyncFunction])

  return { data, loading, error, execute }
}

/**
 * 上一个值Hook
 * @param {*} value - 当前值
 * @returns {*} 上一个值
 */
export const usePrevious = (value) => {
  const ref = useRef()
  
  useEffect(() => {
    ref.current = value
  })
  
  return ref.current
}

/**
 * 窗口大小Hook
 * @returns {Object} {width, height}
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

/**
 * 交集观察器Hook
 * @param {Object} options - 观察器选项
 * @returns {[React.RefObject, boolean]} [ref, isIntersecting]
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [options])

  return [ref, isIntersecting]
}
