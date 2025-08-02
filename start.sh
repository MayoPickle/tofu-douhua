#!/bin/bash

# 停止已运行的进程
pkill -f "node index.js" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "启动豆腐花语音聊天应用..."

# 启动后端服务器
echo "启动后端服务器 (端口 3001)..."
cd server && npm run dev &
SERVER_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务器
echo "启动前端服务器 (端口 5173)..."
cd ../client && npm run dev &
CLIENT_PID=$!

echo "应用已启动！"
echo "前端地址: http://localhost:5173"
echo "后端地址: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止应用"

# 等待用户中断
trap "echo '正在停止服务...'; kill $SERVER_PID $CLIENT_PID; exit" INT
wait