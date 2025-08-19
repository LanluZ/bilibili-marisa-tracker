import VideoCard from './VideoCard.jsx'
import Loading from './Loading.jsx'
import EmptyState from './EmptyState.jsx'
import { EMPTY_STATE_MESSAGES } from '../shared/constants/options.js'

/**
 * 视频网格组件
 * @param {Object} props
 * @param {import('../shared/types/index.js').Video[]} props.videos - 视频列表
 * @param {boolean} props.loading - 是否加载中
 * @param {boolean} props.isTransitioning - 是否过渡中
 * @param {function(string, number): void} props.onShowDetail - 显示详情回调
 */
const VideoGrid = ({ videos, loading, isTransitioning, onShowDetail }) => {
  // 加载状态
  if (loading) {
    return <Loading />
  }

  // 空状态
  if (!videos || videos.length === 0) {
    return (
      <EmptyState 
        message={EMPTY_STATE_MESSAGES.SERVER_ERROR}
        icon="🔍"
      />
    )
  }

  return (
    <div className={`video-grid ${isTransitioning ? 'transitioning' : ''}`}>
      {videos.map((video, index) => (
        <VideoCard 
          key={video.id || index} 
          video={video} 
          index={index}
          onShowDetail={onShowDetail}
        />
      ))}
    </div>
  )
}

export default VideoGrid
