/**
 * 环境配置管理
 */

/**
 * 获取环境变量，支持默认值
 * @param {string} key - 环境变量键名
 * @param {*} defaultValue - 默认值
 * @returns {*} 环境变量值
 */
export const getEnvVar = (key, defaultValue = null) => {
  return import.meta.env[key] ?? defaultValue
}

/**
 * 检查是否为开发环境
 * @returns {boolean}
 */
export const isDevelopment = () => {
  return import.meta.env.MODE === 'development'
}

/**
 * 检查是否为生产环境
 * @returns {boolean}
 */
export const isProduction = () => {
  return import.meta.env.MODE === 'production'
}

/**
 * 应用配置对象
 */
export const config = {
  // 应用信息
  app: {
    name: getEnvVar('VITE_APP_NAME', '魔理沙的秘密书屋'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    description: getEnvVar('VITE_APP_DESCRIPTION', 'B站视频实时数据追踪'),
  },

  // API配置
  api: {
    baseUrl: getEnvVar('VITE_API_BASE_URL', '/api'),
    timeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '10000')),
    retryAttempts: parseInt(getEnvVar('VITE_API_RETRY_ATTEMPTS', '3')),
  },

  // 功能开关
  features: {
    enableVideoDetail: getEnvVar('VITE_ENABLE_VIDEO_DETAIL', 'true') === 'true',
    enableCrawler: getEnvVar('VITE_ENABLE_CRAWLER', 'true') === 'true',
    enableAnalytics: getEnvVar('VITE_ENABLE_ANALYTICS', 'false') === 'true',
    enablePWA: getEnvVar('VITE_ENABLE_PWA', 'false') === 'true',
  },

  // 性能配置
  performance: {
    videosPerPage: parseInt(getEnvVar('VITE_VIDEOS_PER_PAGE', '15')),
    debounceDelay: parseInt(getEnvVar('VITE_DEBOUNCE_DELAY', '300')),
    throttleDelay: parseInt(getEnvVar('VITE_THROTTLE_DELAY', '1000')),
    imageLazyLoading: getEnvVar('VITE_IMAGE_LAZY_LOADING', 'true') === 'true',
  },

  // 外部链接
  links: {
    github: getEnvVar('VITE_GITHUB_URL', 'https://github.com/LanluZ/bilibili-marisa-tracker'),
    bilibili: getEnvVar('VITE_BILIBILI_URL', 'https://www.bilibili.com'),
    documentation: getEnvVar('VITE_DOCS_URL', ''),
  },

  // 开发配置
  dev: {
    enableDevTools: isDevelopment(),
    enableMockApi: getEnvVar('VITE_ENABLE_MOCK_API', 'false') === 'true',
    logLevel: getEnvVar('VITE_LOG_LEVEL', isDevelopment() ? 'debug' : 'error'),
  },
}

/**
 * 日志工具
 */
export const logger = {
  debug: (...args) => {
    if (config.dev.logLevel === 'debug') {
      console.log('[DEBUG]', ...args)
    }
  },
  info: (...args) => {
    if (['debug', 'info'].includes(config.dev.logLevel)) {
      console.info('[INFO]', ...args)
    }
  },
  warn: (...args) => {
    if (['debug', 'info', 'warn'].includes(config.dev.logLevel)) {
      console.warn('[WARN]', ...args)
    }
  },
  error: (...args) => {
    console.error('[ERROR]', ...args)
  },
}

/**
 * 获取完整的API URL
 * @param {string} endpoint - API端点
 * @returns {string} 完整URL
 */
export const getApiUrl = (endpoint) => {
  const baseUrl = config.api.baseUrl
  return endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`
}

/**
 * 获取静态资源URL
 * @param {string} path - 资源路径
 * @returns {string} 完整URL
 */
export const getAssetUrl = (path) => {
  return new URL(path, import.meta.url).href
}

export default config
