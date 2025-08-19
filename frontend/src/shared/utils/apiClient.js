import { API_CONFIG, ERROR_MESSAGES } from '../constants/app.js'

/**
 * 统一的 API 请求工具类
 */
class ApiClient {
  constructor(baseURL = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL
    this.defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  }

  /**
   * 基础请求方法
   * @param {string} url - 请求URL
   * @param {RequestInit} options - 请求选项
   * @returns {Promise<any>} 响应数据
   */
  async request(url, options = {}) {
    try {
      const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`
      const response = await fetch(fullUrl, {
        ...this.defaultOptions,
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API请求失败 [${url}]:`, error)
      this.handleError(error)
      throw error
    }
  }

  /**
   * GET 请求
   * @param {string} url - 请求URL
   * @param {Object} params - 查询参数
   * @returns {Promise<any>} 响应数据
   */
  async get(url, params = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    
    const queryString = searchParams.toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    
    return this.request(fullUrl, { method: 'GET' })
  }

  /**
   * POST 请求
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @returns {Promise<any>} 响应数据
   */
  async post(url, data = null) {
    const options = { method: 'POST' }
    if (data) {
      options.body = JSON.stringify(data)
    }
    return this.request(url, options)
  }

  /**
   * PUT 请求
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @returns {Promise<any>} 响应数据
   */
  async put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE 请求
   * @param {string} url - 请求URL
   * @returns {Promise<any>} 响应数据
   */
  async delete(url) {
    return this.request(url, { method: 'DELETE' })
  }

  /**
   * 错误处理
   * @param {Error} error - 错误对象
   */
  handleError(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // 网络错误
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR)
    } else if (error.message.includes('HTTP')) {
      // HTTP 错误
      throw new Error(ERROR_MESSAGES.API_ERROR)
    }
    // 其他错误直接抛出
    throw error
  }

  /**
   * 设置默认请求头
   * @param {Object} headers - 请求头
   */
  setDefaultHeaders(headers) {
    this.defaultOptions.headers = {
      ...this.defaultOptions.headers,
      ...headers,
    }
  }

  /**
   * 设置认证令牌
   * @param {string} token - 认证令牌
   */
  setAuthToken(token) {
    this.setDefaultHeaders({
      Authorization: `Bearer ${token}`,
    })
  }
}

// 创建默认实例
const apiClient = new ApiClient()

export { ApiClient }
export default apiClient
