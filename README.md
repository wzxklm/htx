# 云平台项目

这是一个标准化的Web项目，提供多种服务，包括应急救援云平台等功能。

## 项目结构

项目已按照标准Web项目结构进行组织：

```
cloud-platform/
│
├── public/              # 公共静态资源目录
│   ├── assets/          # 图片、图标等静态资源
│   ├── css/             # CSS样式文件
│   ├── js/              # 客户端JavaScript
│   ├── index.html       # 主页
│   └── emergency-rescue.html  # 应急救援页面
│
├── src/                 # 源代码目录
│   ├── server/          # 服务器端代码
│   │   └── index.js     # 主服务器文件
│   │
│   └── client/          # 客户端源代码（如需编译的前端代码）
│       ├── js/          # JavaScript源文件
│       ├── css/         # CSS源文件
│       └── pages/       # 页面组件
│
├── data/                # 数据目录
│   └── uploads/         # 文件上传存储目录
│
├── package.json         # 项目配置和依赖
└── README.md            # 项目说明文档
```

## 启动服务

```bash
# 安装依赖
npm install

# 开发模式启动（带热重载）
npm run dev

# 生产模式启动
npm start
```

## API接口

应急救援云平台提供以下API接口：

- `POST /api/upload` - 上传文件
- `GET /api/files-list` - 获取文件列表
- `DELETE /api/files/:id` - 删除指定文件
- `GET /api/status` - 获取服务器状态

## 外部访问

- 服务器本地运行在 http://localhost:8090
- 外部访问地址: http://8.138.134.78:8091
