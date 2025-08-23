import { useState } from 'react'

/**
 * 页头组件
 */
const Header = ({ onSearch = () => {} }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    onSearch(searchTerm.trim())
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    // 实时搜索（可选）
    if (e.target.value.trim().length >= 2) {
      onSearch(e.target.value.trim())
    } else if (e.target.value.trim().length === 0) {
      onSearch('')
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    onSearch('')
  }

  return (
    <header className="header">
      <div className="header-left">
        <h1>魔理沙的秘密书屋</h1>
        <p className="subtitle">红魔馆的常客</p>
      </div>
      
      <div className="header-right">
        <form className="search-container" onSubmit={handleSearchSubmit}>
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索视频标题..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <button 
                type="button" 
                className="clear-button"
                onClick={handleClearSearch}
                title="清除搜索"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
            <button type="submit" className="search-button">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </header>
  )
}

export default Header
