# 魔理沙的秘密☆书屋

![](images/001.png)

**魔理沙的秘密☆书屋** 是来自 mikufan 的 基于React开发 的 Web 应用, 是我用于观察今天最神金的视频, 从而可以理解神人, 模仿神人, 成为神人. 

### 工作机制

1. 手动模式
2. 自动模式
    - 每隔30分钟触发一次自动任务,可以修改`backend/main.py`改变触发时间
   ```python
    def start_scheduler():
        """启动定时任务"""
        global stop_scheduler
        while not stop_scheduler:
            try:
                time.sleep(30)  # 每分钟检查一次
                current_time = time.time()
    ```

## 技术架构

### 整体架构
```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   React 前端    │ ←────────────→ │  FastAPI 后端   │
│   (端口: 3000)  │                │   (端口: 8000)  │
└─────────────────┘                └─────────────────┘
                                           │
                                           ▼
                                   ┌─────────────────┐
                                   │  SQLite 数据库  │
                                   │ bilibili_videos │
                                   └─────────────────┘
                                           ▲
                                           │
                                   ┌─────────────────┐
                                   │ Selenium 爬虫   │
                                   │   + Chrome      │
                                   └─────────────────┘
```


## 贡献指南

欢迎提交 Issue 和 Pull Request！
