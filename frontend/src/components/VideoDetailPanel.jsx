import React from 'react';
import VideoDetailCard from './VideoDetailCard';
import './VideoDetailPanel.css';

/**
 * 视频详情面板组件 - 显示在侧边栏左侧的独立面板
 */
const VideoDetailPanel = ({ 
  isVisible, 
  videoDetail, 
  loading, 
  error, 
  onClose,
  sidebarOpen // 新增：侧边栏开启状态
}) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 根据当前状态确定容器类名
  const getContainerClass = () => {
    let baseClass = 'video-detail-container';
    
    if (loading) {
      baseClass += ' loading-state';
    } else if (error) {
      baseClass += ' error-state';
    } else if (videoDetail) {
      baseClass += ' content-state';
    }
    
    return baseClass;
  };

  return (
    <div 
      className={`video-detail-overlay ${isVisible ? 'visible' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={getContainerClass()}>
        <VideoDetailCard
          videoDetail={videoDetail}
          loading={loading}
          error={error}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default VideoDetailPanel;
