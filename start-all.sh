#!/bin/bash

# 启动后端服务 (在后台)
cd server
pnpm run start:prod &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 5

# 启动前端服务 (开发模式，支持代理)
pnpm run dev -- --host 0.0.0.0 --port 5000

# 清理
kill $BACKEND_PID 2>/dev/null
