/**
 * 控制面板组件
 */
const Controls = ({ 
  dates,
  selectedDate,
  onDateChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange
}) => {
  return (
    <div className="controls">
      <div className="control-group">
        <label>选择日期</label>
        <div className="select-container">
          <select 
            value={selectedDate} 
            onChange={(e) => onDateChange(e.target.value)}
            className="select"
          >
            {dates && dates.length > 0 ? (
              dates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))
            ) : (
              <option value="">暂无数据</option>
            )}
          </select>
        </div>
      </div>

      <div className="control-group">
        <label>排序方式</label>
        <div className="select-container">
          <select 
            value={sortBy} 
            onChange={(e) => onSortByChange(e.target.value)}
            className="select"
          >
            <option value="view_count">播放量</option>
            <option value="online_count">当前在线人数</option>
            <option value="max_online_count">历史最高在线人数</option>
            <option value="title">标题</option>
          </select>
        </div>
      </div>

      <div className="control-group">
        <label>排序顺序</label>
        <div className="select-container">
          <select 
            value={sortOrder} 
            onChange={(e) => onSortOrderChange(e.target.value)}
            className="select"
          >
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default Controls
