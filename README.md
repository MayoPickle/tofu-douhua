# 豆腐花语音聊天 - Discord Clone

一个类似 Discord 的 WebRTC 语音聊天应用，支持邮箱注册、频道管理、语音通话和实时聊天。

## ✨ 功能特性

- 🔐 用户邮箱注册和登录系统
- 📞 创建和加入语音频道
- 🎙️ WebRTC 实时语音通信
- 💬 实时文字聊天
- 👥 用户在线状态显示
- 🎨 现代化 UI 设计 (Ant Design)

## 🛠️ 技术栈

### 前端
- **React + TypeScript** - 现代化前端框架
- **Vite** - 快速构建工具
- **Ant Design** - 企业级 UI 设计语言
- **Socket.IO Client** - WebSocket 客户端
- **WebRTC API** - 实时音视频通信

### 后端
- **Node.js + Express** - 服务端框架
- **SQLite** - 轻量级数据库
- **Socket.IO** - WebSocket 服务端
- **JWT** - 身份认证
- **bcryptjs** - 密码加密

## 🚀 快速开始

### 前置要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖

```bash
# 克隆项目
git clone [your-repo-url]
cd tofu-douhua

# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

### 运行项目

#### 方法一：使用启动脚本 (推荐)
```bash
chmod +x start.sh
./start.sh
```

#### 方法二：手动启动
```bash
# 启动后端服务 (端口 3001)
cd server
npm run dev

# 新终端窗口，启动前端服务 (端口 5173)
cd client
npm run dev
```

### 🌐 访问应用
- 前端应用: http://localhost:5173
- 后端 API: http://localhost:3001

## 📁 项目结构

```
tofu-douhua/
├── client/                    # React 前端应用
│   ├── src/
│   │   ├── components/        # React 组件
│   │   │   ├── Auth.tsx       # 登录/注册组件
│   │   │   ├── MainApp.tsx    # 主应用组件
│   │   │   ├── ChannelList.tsx # 频道列表
│   │   │   └── ChatArea.tsx   # 聊天区域
│   │   ├── services/          # API 服务
│   │   │   ├── api.ts         # HTTP API 客户端
│   │   │   └── socket.ts      # WebSocket 客户端
│   │   ├── hooks/             # React Hooks
│   │   │   └── useWebRTC.ts   # WebRTC Hook
│   │   ├── types/             # TypeScript 类型定义
│   │   └── App.tsx            # 应用入口
│   └── package.json
├── server/                    # Node.js 后端
│   ├── index.js               # 主服务器文件
│   ├── discord.db             # SQLite 数据库文件 (自动生成)
│   └── package.json
├── start.sh                   # 一键启动脚本
└── README.md
```

## 🎯 使用说明

### 1. 注册/登录
- 首次使用需要注册账号（邮箱 + 密码 + 用户名）
- 已有账号可直接登录

### 2. 创建频道
- 点击频道列表右上角的 "+" 按钮
- 输入频道名称和描述
- 创建后自动加入频道

### 3. 加入频道
- 点击任意频道即可加入
- 加入后可以看到频道内的聊天记录

### 4. 语音通话
- 在频道内点击 "加入语音" 按钮
- 授权麦克风权限
- 与频道内其他用户进行语音通话

### 5. 文字聊天
- 在聊天框输入消息并发送
- 所有频道成员都能看到消息

## 🔧 开发说明

### 数据库结构
应用使用 SQLite 数据库，包含以下表：
- `users` - 用户信息
- `channels` - 频道信息  
- `channel_members` - 频道成员关系
- `messages` - 聊天消息

### API 接口
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/channels` - 获取频道列表
- `POST /api/channels` - 创建频道
- `POST /api/channels/:id/join` - 加入频道
- `GET /api/channels/:id/messages` - 获取频道消息

### WebSocket 事件
- `user-joined` - 用户上线
- `join-channel` - 加入频道
- `leave-channel` - 离开频道
- `send-message` - 发送消息
- `webrtc-signal` - WebRTC 信令

## 🐛 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 停止占用端口的进程
   pkill -f "node index.js"
   pkill -f "vite"
   ```

2. **数据库权限问题**
   ```bash
   # 确保 server 目录有写权限
   chmod 755 server/
   ```

3. **麦克风权限**
   - 确保浏览器允许访问麦克风
   - 使用 HTTPS 或 localhost 访问

4. **WebRTC 连接问题**
   - 检查防火墙设置
   - 确保网络支持 P2P 连接

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License