/**
 * 应用级常量配置
 */

// 分页配置
export const PAGINATION = {
  VIDEOS_PER_PAGE: 15,
  DEFAULT_PAGE: 1,
}

// 排序配置
export const SORT_OPTIONS = {
  FIELDS: {
    VIEW_COUNT: 'view_count',
    ONLINE_COUNT: 'online_count',
    MAX_ONLINE_COUNT: 'max_online_count',
    TITLE: 'title',
  },
  ORDERS: {
    DESC: 'desc',
    ASC: 'asc',
  },
}

// API 配置
export const API_CONFIG = {
  BASE_URL: '/api',
  ENDPOINTS: {
    DATES: '/api/dates',
    VIDEOS: '/api/videos',
    CRAWL_STATUS: '/api/crawl/status',
    CRAWL_START: '/api/crawl/start',
    VIDEO_DETAIL: '/api/video/detail',
    ZONE_STATS: '/api/zone/stats',
    PROXY_IMAGE: '/api/proxy/image',
  },
}

// 布局配置
export const LAYOUT = {
  SIDEBAR_WIDTH: 300,
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 992,
    DESKTOP: 1200,
  },
}

// 应用信息
export const APP_INFO = {
  NAME: '魔理沙的秘密书屋',
  DESCRIPTION: 'B站视频实时数据追踪',
  GITHUB_URL: 'https://github.com/LanluZ/bilibili-marisa-tracker',
}

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接异常，请检查网络或稍后重试',
  API_ERROR: '服务器异常，请稍后重试',
  DATA_LOAD_ERROR: '数据加载失败',
  VIDEO_DETAIL_ERROR: '获取视频详情失败',
}
