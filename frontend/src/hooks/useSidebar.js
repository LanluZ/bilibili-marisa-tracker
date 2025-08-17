import { useState, useEffect } from 'react'

/**
 * 管理侧边栏状态的Hook
 */
export const useSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 点击外部区域关闭侧边栏
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && 
          !event.target.closest('.sidebar') && 
          !event.target.closest('.sidebar-toggle')) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)
  const openSidebar = () => setSidebarOpen(true)

  return {
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar
  }
}
