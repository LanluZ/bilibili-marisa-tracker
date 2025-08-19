/**
 * 应用程序类型定义（使用 JSDoc）
 */

/**
 * 视频信息类型
 * @typedef {Object} Video
 * @property {string} id - 视频唯一标识
 * @property {string} bvid - B站视频ID (BV号)
 * @property {number|string} aid - B站视频ID (AV号)
 * @property {number} cid - 视频CID
 * @property {string} title - 视频标题
 * @property {string} pic - 视频封面图片URL
 * @property {number} view_count - 播放量
 * @property {string|number} online_count - 当前在线人数
 * @property {number} max_online_count - 历史最高在线人数
 * @property {string} max_online_time - 最高在线人数记录时间
 * @property {string} crawl_date - 爬取日期
 * @property {string} crawl_time - 爬取时间
 * @property {number} tid_v2 - 分区ID
 */

/**
 * 视频详情类型
 * @typedef {Object} VideoDetail
 * @property {number} aid - 视频AV号
 * @property {string} bvid - 视频BV号
 * @property {string} title - 视频标题
 * @property {string} pic - 视频封面
 * @property {number} tid - 分区ID
 * @property {number} tid_v2 - 分区ID v2
 * @property {string} tname - 分区名称
 * @property {string} tname_v2 - 分区名称 v2
 * @property {string} pubdate - 发布时间
 * @property {string} ctime - 创建时间
 * @property {string} desc - 视频描述
 * @property {Object} owner - 视频作者信息
 * @property {Object} stat - 视频统计信息
 * @property {number} copyright - 版权类型
 */

/**
 * 分区筛选类型
 * @typedef {Object} ZoneFilter
 * @property {string} mainZone - 主分区ID
 * @property {string} subZone - 子分区ID
 * @property {string} mainZoneName - 主分区名称
 * @property {string} subZoneName - 子分区名称
 */

/**
 * 爬虫状态类型
 * @typedef {Object} CrawlStatus
 * @property {boolean} is_crawling - 是否正在爬取
 * @property {string} [message] - 状态消息
 * @property {number} [progress] - 进度百分比
 */

/**
 * 分页信息类型
 * @typedef {Object} PaginationInfo
 * @property {number} currentPage - 当前页码
 * @property {number} totalPages - 总页数
 * @property {number} totalVideos - 视频总数
 * @property {number} videosPerPage - 每页视频数量
 */

/**
 * API 响应类型
 * @typedef {Object} ApiResponse
 * @property {boolean} success - 请求是否成功
 * @property {*} data - 响应数据
 * @property {string} [message] - 响应消息
 * @property {string} [error] - 错误信息
 */

/**
 * 分区统计类型
 * @typedef {Object} ZoneStats
 * @property {Object<string, number>} stats - 分区ID到视频数量的映射
 */

/**
 * 组件 Props 类型定义
 */

/**
 * 视频卡片组件 Props
 * @typedef {Object} VideoCardProps
 * @property {Video} video - 视频信息
 * @property {number} index - 视频索引
 * @property {function(string, number): void} [onShowDetail] - 显示详情回调
 */

/**
 * 控制面板组件 Props
 * @typedef {Object} ControlsProps
 * @property {string[]} dates - 可用日期列表
 * @property {string} selectedDate - 选中的日期
 * @property {function(string): void} onDateChange - 日期变化回调
 * @property {string} sortBy - 排序字段
 * @property {function(string): void} onSortByChange - 排序字段变化回调
 * @property {string} sortOrder - 排序方向
 * @property {function(string): void} onSortOrderChange - 排序方向变化回调
 * @property {ZoneFilter} zoneFilter - 分区筛选
 * @property {function(ZoneFilter): void} onZoneFilterChange - 分区筛选变化回调
 * @property {ZoneStats} zoneStats - 分区统计
 */

/**
 * 侧边栏组件 Props
 * @typedef {Object} SidebarProps
 * @property {boolean} isOpen - 是否打开
 * @property {function(): void} onToggle - 切换回调
 * @property {number} totalVideos - 视频总数
 * @property {number} currentPage - 当前页码
 * @property {number} totalPages - 总页数
 * @property {CrawlStatus} crawlStatus - 爬虫状态
 * @property {function(): void} onStartCrawl - 开始爬取回调
 */

export {}
