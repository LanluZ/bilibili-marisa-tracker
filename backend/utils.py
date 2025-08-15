def parse_online_count(online_count_str: str) -> int:
    """
    解析在线观看人数字符串，支持中文"万"字符和"+"号
    
    Args:
        online_count_str: 在线人数字符串，如 "1.2万", "5000+", "123"
        
    Returns:
        int: 解析后的数字
    """
    try:
        online_count_str = str(online_count_str)
        
        # 移除+号
        if '+' in online_count_str:
            online_count_str = online_count_str.replace('+', '')
        
        # 处理万字符
        if '万' in online_count_str:
            number_part = online_count_str.split('万')[0]
            return int(float(number_part) * 10000)
        else:
            return int(float(online_count_str))
            
    except (ValueError, TypeError):
        print(f"无法解析观看人数: {online_count_str} -> 使用默认值0")
        return 0


def format_number(number: int) -> str:
    """
    格式化数字显示
    
    Args:
        number: 要格式化的数字
        
    Returns:
        str: 格式化后的字符串
    """
    if number >= 10000:
        return f"{number / 10000:.1f}万"
    else:
        return str(number)


def validate_bvid(bvid: str) -> bool:
    """
    验证B站视频ID格式
    
    Args:
        bvid: B站视频ID
        
    Returns:
        bool: 是否为有效格式
    """
    if not bvid:
        return False
    
    # B站BV号格式验证：BV开头，12位字符
    if bvid.startswith('BV') and len(bvid) == 12:
        return True
    
    return False


def safe_get(data: dict, key: str, default=None):
    """
    安全获取字典值
    
    Args:
        data: 字典
        key: 键名
        default: 默认值
        
    Returns:
        获取到的值或默认值
    """
    try:
        return data.get(key, default)
    except (AttributeError, TypeError):
        return default


def truncate_title(title: str, max_length: int = 50) -> str:
    """
    截断标题长度
    
    Args:
        title: 原标题
        max_length: 最大长度
        
    Returns:
        str: 截断后的标题
    """
    if not title:
        return ""
    
    if len(title) > max_length:
        return title[:max_length - 3] + "..."
    
    return title
