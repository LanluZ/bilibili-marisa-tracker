import VideoCard from './VideoCard.jsx'

/**
 * 视频网格组件
 */
const VideoGrid = ({ videos, loading, isTransitioning }) => {
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="empty-state">
        <p>服务器走丢了喵</p>
        <p>等待后端API程序启动中...</p>
      </div>
    )
  }

  return (
    <div className={`video-grid ${isTransitioning ? 'transitioning' : ''}`}>
      {videos.map((video, index) => (
        <VideoCard 
          key={video.id || index} 
          video={video} 
          index={index} 
        />
      ))}
    </div>
  )
}

export default VideoGrid
