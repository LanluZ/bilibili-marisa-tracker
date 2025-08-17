import { Component } from 'react'

/**
 * 错误边界组件
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('错误边界捕获到错误:', error, errorInfo)
    // 添加更详细的错误日志
    console.error('错误堆栈:', error.stack)
    console.error('组件堆栈:', errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>🚫 出现了一些问题</h2>
          <p>页面遇到了错误，请刷新页面重试。</p>
          <details style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5' }}>
            <summary>错误详情 (点击查看)</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {this.state.error ? this.state.error.toString() : '未知错误'}
            </pre>
          </details>
          <button onClick={() => window.location.reload()} className="retry-btn">
            🔄 刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
