import { logger } from './config.js'

/**
 * 性能监控工具
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = new Map()
  }

  /**
   * 开始性能测量
   * @param {string} name - 测量名称
   */
  start(name) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`)
      this.metrics.set(name, { startTime: performance.now() })
    }
  }

  /**
   * 结束性能测量
   * @param {string} name - 测量名称
   * @returns {number|null} 耗时(毫秒)
   */
  end(name) {
    if (typeof performance !== 'undefined' && this.metrics.has(name)) {
      const endTime = performance.now()
      const startTime = this.metrics.get(name).startTime
      const duration = endTime - startTime
      
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      logger.debug(`性能测量 [${name}]: ${duration.toFixed(2)}ms`)
      
      this.metrics.set(name, {
        ...this.metrics.get(name),
        endTime,
        duration
      })
      
      return duration
    }
    return null
  }

  /**
   * 获取测量结果
   * @param {string} name - 测量名称
   * @returns {Object|null} 测量结果
   */
  getMetric(name) {
    return this.metrics.get(name) || null
  }

  /**
   * 获取所有测量结果
   * @returns {Map} 所有测量结果
   */
  getAllMetrics() {
    return new Map(this.metrics)
  }

  /**
   * 清除测量结果
   * @param {string} [name] - 测量名称，不传则清除所有
   */
  clear(name) {
    if (name) {
      this.metrics.delete(name)
      if (typeof performance !== 'undefined') {
        try {
          performance.clearMarks(`${name}-start`)
          performance.clearMarks(`${name}-end`)
          performance.clearMeasures(name)
        } catch {
          // 忽略错误
        }
      }
    } else {
      this.metrics.clear()
      if (typeof performance !== 'undefined') {
        try {
          performance.clearMarks()
          performance.clearMeasures()
        } catch {
          // 忽略错误
        }
      }
    }
  }

  /**
   * 监听导航性能
   */
  observeNavigation() {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              logger.info('页面导航性能:', {
                domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                loadComplete: entry.loadEventEnd - entry.loadEventStart,
                totalTime: entry.loadEventEnd - entry.fetchStart
              })
            }
          })
        })
        
        observer.observe({ entryTypes: ['navigation'] })
        this.observers.set('navigation', observer)
      } catch (error) {
        logger.warn('导航性能监听不支持:', error)
      }
    }
  }

  /**
   * 监听资源加载性能
   */
  observeResources() {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.duration > 1000) { // 只记录耗时较长的资源
              logger.debug(`资源加载耗时 [${entry.name}]: ${entry.duration.toFixed(2)}ms`)
            }
          })
        })
        
        observer.observe({ entryTypes: ['resource'] })
        this.observers.set('resource', observer)
      } catch (error) {
        logger.warn('资源性能监听不支持:', error)
      }
    }
  }

  /**
   * 监听长任务
   */
  observeLongTasks() {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            logger.warn(`检测到长任务: ${entry.duration.toFixed(2)}ms`)
          })
        })
        
        observer.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', observer)
      } catch {
        logger.debug('长任务监听不支持')
      }
    }
  }

  /**
   * 获取页面性能指标
   * @returns {Object} 性能指标
   */
  getPageMetrics() {
    if (typeof performance === 'undefined' || !performance.timing) {
      return null
    }

    const timing = performance.timing
    const navigation = performance.navigation

    return {
      // 页面加载时间
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      // DOM 解析时间
      domParseTime: timing.domComplete - timing.domLoading,
      // 资源加载时间
      resourceLoadTime: timing.loadEventEnd - timing.domContentLoadedEventEnd,
      // 首字节时间
      ttfb: timing.responseStart - timing.navigationStart,
      // DOM 准备时间
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      // 导航类型
      navigationType: navigation.type,
      // 重定向次数
      redirectCount: navigation.redirectCount
    }
  }

  /**
   * 断开所有观察器
   */
  disconnect() {
    this.observers.forEach((observer) => {
      observer.disconnect()
    })
    this.observers.clear()
  }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor()

// 自动开始监听
if (typeof window !== 'undefined') {
  performanceMonitor.observeNavigation()
  performanceMonitor.observeResources()
  performanceMonitor.observeLongTasks()
}

/**
 * 性能装饰器函数
 * @param {string} name - 测量名称
 * @returns {Function} 装饰器函数
 */
export const measure = (name) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args) {
      performanceMonitor.start(name)
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } finally {
        performanceMonitor.end(name)
      }
    }
    
    return descriptor
  }
}

/**
 * 性能测量 Hook
 * @param {string} name - 测量名称
 * @param {Function} fn - 要测量的函数
 * @returns {*} 函数返回值
 */
export const usePerformanceMeasure = (name, fn) => {
  // 注意：这个Hook需要在React环境中使用
  // 这里只是示例，实际使用时需要导入React
  console.warn('usePerformanceMeasure需要在React环境中使用')
  return fn
}

export { performanceMonitor }
export default performanceMonitor
