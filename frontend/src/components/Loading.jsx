import { EMPTY_STATE_MESSAGES } from '../shared/constants/options.js'

/**
 * 通用加载组件
 * @param {Object} props
 * @param {boolean} props.loading - 是否加载中
 * @param {string} [props.message] - 加载消息
 * @param {string} [props.size] - 大小 (small, medium, large)
 * @param {React.ReactNode} [props.children] - 子组件
 */
const Loading = ({ 
  loading = true, 
  message = EMPTY_STATE_MESSAGES.LOADING, 
  size = 'medium',
  children 
}) => {
  if (!loading && children) {
    return children
  }

  if (!loading) {
    return null
  }

  return (
    <div className={`loading loading-${size}`}>
      <div className="spinner"></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  )
}

export default Loading
