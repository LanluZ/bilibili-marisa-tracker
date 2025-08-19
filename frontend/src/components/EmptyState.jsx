import { EMPTY_STATE_MESSAGES } from '../shared/constants/options.js'

/**
 * 通用空状态组件
 * @param {Object} props
 * @param {string} [props.message] - 空状态消息
 * @param {string} [props.icon] - 图标
 * @param {React.ReactNode} [props.action] - 操作按钮
 * @param {string} [props.size] - 大小 (small, medium, large)
 */
const EmptyState = ({ 
  message = EMPTY_STATE_MESSAGES.NO_VIDEOS,
  icon = '📭',
  action = null,
  size = 'medium'
}) => {
  return (
    <div className={`empty-state empty-state-${size}`}>
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-message">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}

export default EmptyState
