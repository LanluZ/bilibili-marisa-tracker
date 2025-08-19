import { SORT_OPTIONS } from '../constants/app.js'

/**
 * 控制面板选项配置
 */

// 排序方式选项
export const SORT_BY_OPTIONS = [
  { 
    value: SORT_OPTIONS.FIELDS.VIEW_COUNT, 
    label: '播放量', 
    icon: '📊',
    description: '按视频播放量排序' 
  },
  { 
    value: SORT_OPTIONS.FIELDS.ONLINE_COUNT, 
    label: '当前在线人数', 
    icon: '🔴',
    description: '按当前观看人数排序' 
  },
  { 
    value: SORT_OPTIONS.FIELDS.MAX_ONLINE_COUNT, 
    label: '历史最高在线人数', 
    icon: '⭐',
    description: '按历史最高在线人数排序'
  },
  { 
    value: SORT_OPTIONS.FIELDS.TITLE, 
    label: '标题', 
    icon: '🔤',
    description: '按视频标题排序' 
  }
]

// 排序顺序选项
export const SORT_ORDER_OPTIONS = [
  { 
    value: SORT_OPTIONS.ORDERS.DESC, 
    label: '降序', 
    icon: '⬇️',
    description: '从高到低排列' 
  },
  { 
    value: SORT_OPTIONS.ORDERS.ASC, 
    label: '升序', 
    icon: '⬆️',
    description: '从低到高排列' 
  }
]

// 默认分区选项
export const DEFAULT_ZONE_OPTION = { value: '', label: '全部分区' }
export const DEFAULT_SUB_ZONE_OPTION = { value: '', label: '全部子分区' }

// 空状态消息
export const EMPTY_STATE_MESSAGES = {
  NO_MAIN_ZONE: '请先选择主分区',
  NO_SUB_ZONES: '该分区无子分区',
  NO_VIDEOS: '暂无视频数据',
  LOADING: '加载中...',
  SERVER_ERROR: '服务器走丢了喵\n等待后端API程序启动中...'
}
