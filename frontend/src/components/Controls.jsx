import DatePicker from './DatePicker'
import CustomSelect from './CustomSelect'
import bilibiliZones from '../utils/bilibiliZones.json'
import { useState, useEffect } from 'react'

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
  onSortOrderChange,
  zoneFilter,
  onZoneFilterChange,
  zoneStats = {}
}) => {
  const [showSubZone, setShowSubZone] = useState(false)

  // 监听主分区变化，控制子分区显示
  useEffect(() => {
    if (zoneFilter?.mainZone) {
      setShowSubZone(true)
    } else {
      setShowSubZone(false)
    }
  }, [zoneFilter?.mainZone])

  // 计算主分区的视频总数（包括所有子分区）
  const getMainZoneVideoCount = (mainTid) => {
    const zone = bilibiliZones.bilibiliZonesV2[mainTid]
    if (!zone) return 0
    
    let totalCount = 0
    
    // 如果该主分区有子分区，统计所有子分区的视频数量
    if (zone.children) {
      Object.keys(zone.children).forEach(subTid => {
        totalCount += zoneStats[subTid] || 0
      })
    }
    
    // 如果该主分区本身也有视频（某些主分区可能直接有视频），也要统计
    totalCount += zoneStats[mainTid] || 0
    
    return totalCount
  }
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

  // 获取所有主分区选项
  const getMainZoneOptions = () => {
    const zones = bilibiliZones.bilibiliZonesV2
    const mainZoneOptions = [
      { value: '', label: '全部分区' }
    ]
    
    Object.entries(zones)
      .filter(([tid, zone]) => !zone.hidden) // 过滤隐藏分区
      .map(([tid, zone]) => {
        const videoCount = getMainZoneVideoCount(tid)
        return {
          value: tid,
          label: `${zone.name} (${videoCount})`
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
      .forEach(option => mainZoneOptions.push(option))
    
    return mainZoneOptions
  }

  // 获取子分区选项
  const getSubZoneOptions = () => {
    if (!zoneFilter?.mainZone) {
      return [{ value: '', label: '请先选择主分区' }]
    }
    
    const zone = bilibiliZones.bilibiliZonesV2[zoneFilter.mainZone]
    if (!zone || !zone.children) {
      return [{ value: '', label: '该分区无子分区' }]
    }
    
    const subZoneOptions = [
      { value: '', label: '全部子分区' }
    ]
    
    Object.entries(zone.children)
      .map(([tid, name]) => {
        const videoCount = zoneStats[tid] || 0
        return {
          value: tid,
          label: `${name} (${videoCount})`
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
      .forEach(option => subZoneOptions.push(option))
    
    return subZoneOptions
  }

  // 处理主分区变化
  const handleMainZoneChange = (mainZone) => {
    const mainZoneName = mainZone ? getMainZoneOptions().find(z => z.value === mainZone)?.label : ''
    onZoneFilterChange({
      mainZone,
      subZone: '', // 清空子分区
      mainZoneName,
      subZoneName: ''
    })
  }

  // 处理子分区变化
  const handleSubZoneChange = (subZone) => {
    const subZoneName = subZone ? getSubZoneOptions().find(z => z.value === subZone)?.label : ''
    onZoneFilterChange({
      ...zoneFilter,
      subZone,
      subZoneName
    })
  }

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
        <label>主分区</label>
        <CustomSelect
          value={zoneFilter?.mainZone || ''}
          onChange={handleMainZoneChange}
          options={getMainZoneOptions()}
          placeholder="选择主分区"
          icon="🎯"
        />
      </div>

      <div className={`control-group sub-zone-group ${showSubZone ? 'show' : 'hide'}`}>
        <label>子分区</label>
        <CustomSelect
          value={zoneFilter?.subZone || ''}
          onChange={handleSubZoneChange}
          options={getSubZoneOptions()}
          placeholder="选择子分区"
          icon="📁"
          disabled={!zoneFilter?.mainZone}
        />
      </div>

      <div className="control-group">
        <label>排序方式</label>
        <CustomSelect
          value={sortBy}
          onChange={onSortByChange}
          options={sortOptions}
          placeholder="选择排序方式"
          icon="📊"
        />
      </div>

      <div className="control-group">
        <label>排序顺序</label>
        <CustomSelect
          value={sortOrder}
          onChange={onSortOrderChange}
          options={orderOptions}
          placeholder="选择排序顺序"
          icon="🔢"
        />
      </div>
    </div>
  )
}

export default Controls
