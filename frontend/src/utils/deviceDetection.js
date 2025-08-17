/**
 * 设备检测工具函数
 */

/**
 * 检测是否为触摸设备
 */
export const isTouchDevice = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * 检测是否为移动设备
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * 检测用户代理是否为移动设备
 */
export const isMobileUserAgent = () => {
  return /Mobi|Android/i.test(navigator.userAgent)
}

/**
 * 检测屏幕尺寸是否为移动端
 */
export const isMobileScreenSize = () => {
  return window.innerWidth <= 768
}

/**
 * 综合检测是否应该使用移动端UI
 */
export const shouldUseMobileUI = () => {
  return isTouchDevice() || isMobileDevice() || isMobileScreenSize()
}

/**
 * 添加设备类型到body元素的class
 */
export const addDeviceClassToBody = () => {
  const body = document.body
  
  // 移除已存在的设备类型class
  body.classList.remove('touch-device', 'non-touch-device', 'mobile-device', 'desktop-device')
  
  // 添加设备类型class
  if (isTouchDevice()) {
    body.classList.add('touch-device')
  } else {
    body.classList.add('non-touch-device')
  }
  
  if (shouldUseMobileUI()) {
    body.classList.add('mobile-device')
  } else {
    body.classList.add('desktop-device')
  }
}
