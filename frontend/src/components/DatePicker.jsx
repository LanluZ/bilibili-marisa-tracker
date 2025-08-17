import { useState, useRef, useEffect } from 'react'
import './DatePicker.css'

/**
 * 自定义日期选择器组件
 */
const DatePicker = ({ dates, selectedDate, onDateChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  // 过滤日期
  const filteredDates = dates?.filter(date => 
    date.includes(searchTerm)
  ) || []

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleDateSelect = (date) => {
    onDateChange(date)
    setIsOpen(false)
    setSearchTerm('')
  }

  const formatDisplayDate = (date) => {
    if (!date) return '请选择日期'
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="date-picker" ref={dropdownRef}>
      <div 
        className={`date-picker-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="date-display">
          <span className="date-icon"></span>
          <span className="date-text">{formatDisplayDate(selectedDate)}</span>
        </div>
        <span className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <>
          {/* 背景遮罩层 */}
          <div className="dropdown-backdrop" onClick={() => setIsOpen(false)} />
          
          <div className="date-picker-dropdown">
            <div className="search-container">
              <input
                type="text"
                placeholder="搜索日期..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="date-search"
              />
              <span className="search-icon">🔍</span>
            </div>
            
            <div className="date-list">
              {filteredDates.length > 0 ? (
                filteredDates.map((date, index) => (
                  <div
                    key={date}
                    className={`date-item ${selectedDate === date ? 'selected' : ''}`}
                    onClick={() => handleDateSelect(date)}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <span className="date-value">{date}</span>
                    <span className="date-formatted">{formatDisplayDate(date)}</span>
                  </div>
                ))
              ) : (
                <div className="no-dates">
                  <span>😔 没有找到匹配的日期</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DatePicker
