import DatePicker from './DatePicker'
import CustomSelect from './CustomSelect'

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
  // 排序方式选项
  const sortOptions = [
    { 
      value: 'view_count', 
      label: '播放量', 
      icon: '',
      description: '按视频播放量排序' 
    },
    { 
      value: 'online_count', 
      label: '当前在线人数', 
      icon: '',
      description: '按当前观看人数排序' 
    },
    { 
      value: 'max_online_count', 
      label: '历史最高在线人数', 
      icon: '',
      description: '按历史最高在线人数排序'
    },
    { 
      value: 'title', 
      label: '标题', 
      icon: '',
      description: '按视频标题排序' 
    }
  ]

  // 排序顺序选项
  const orderOptions = [
    { 
      value: 'desc', 
      label: '降序', 
      icon: '',
      description: '从高到低排列' 
    },
    { 
      value: 'asc', 
      label: '升序', 
      icon: '',
      description: '从低到高排列' 
    }
  ]

  return (
    <div className="controls">
      <div className="control-group">
        <label>选择日期</label>
        <DatePicker
          dates={dates || []}
          selectedDate={selectedDate}
          onDateChange={onDateChange}
        />
      </div>

      <div className="control-group">
        <label>排序方式</label>
        <CustomSelect
          value={sortBy}
          onChange={onSortByChange}
          options={sortOptions}
          placeholder="选择排序方式"
          icon=""
        />
      </div>

      <div className="control-group">
        <label>排序顺序</label>
        <CustomSelect
          value={sortOrder}
          onChange={onSortOrderChange}
          options={orderOptions}
          placeholder="选择排序顺序"
          icon=""
        />
      </div>
    </div>
  )
}

export default Controls
