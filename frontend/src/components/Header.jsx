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
              autoComplete="off"
            />
            {searchTerm && (
              <button 
                type="button" 
                className="clear-button"
                onClick={handleClearSearch}
                title="清除搜索"
              >
                ✕
              </button>
            )}
            <button type="submit" className="search-button" title="搜索">
              🔍
            </button>
          </div>
        </form>
      </div>
    </header>
  )
}

export default Header
