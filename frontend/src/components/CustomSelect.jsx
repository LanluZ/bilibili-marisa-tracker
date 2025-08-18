import { useState, useRef, useEffect } from 'react'
import './CustomSelect.css'

/**
 * 自定义下拉框组件
 */
const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder = '请选择...', 
  label,
  icon,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  // 过滤选项
  const filteredOptions = options?.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleOptionSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const selectedOption = options?.find(option => option.value === value)

  return (
    <div className={`custom-select ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
      <div 
        className={`select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="select-display">
          {icon && <span className="select-icon">{icon}</span>}
          <span className="select-text">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <span className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`}>▼</span>
      </div>

      {isOpen && !disabled && (
        <>
          {/* 背景遮罩层 */}
          <div className="dropdown-backdrop" onClick={() => setIsOpen(false)} />
          
          <div className="select-dropdown">
            {options.length > 5 && (
              <div className="search-container">
                <input
                  type="text"
                  placeholder="搜索选项..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="option-search"
                />
                <span className="search-icon">🔍</span>
              </div>
            )}
            
            <div className="option-list">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    className={`option-item ${value === option.value ? 'selected' : ''}`}
                    onClick={() => handleOptionSelect(option.value)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {option.icon && <span className="option-icon">{option.icon}</span>}
                    <div className="option-content">
                      <span className="option-label">{option.label}</span>
                      {option.description && (
                        <span className="option-description">{option.description}</span>
                      )}
                    </div>
                    {value === option.value && <span className="check-mark">✓</span>}
                  </div>
                ))
              ) : (
                <div className="no-options">
                  <span>😔 没有找到匹配的选项</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CustomSelect
