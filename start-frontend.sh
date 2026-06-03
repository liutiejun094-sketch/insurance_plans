#!/bin/bash

echo "🚀 启动保险方案对比AI - 前端服务"

PORT=8000

# 检查 Python 是否可用
if command -v python3 &> /dev/null; then
    echo "✅ 使用 Python3 启动静态服务器"
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "✅ 使用 Python 启动静态服务器"
    python -m http.server $PORT
elif command -v node &> /dev/null; then
    echo "✅ 使用 Node.js http-server"
    if ! command -v http-server &> /dev/null; then
        npm install -g http-server
    fi
    http-server -p $PORT
else
    echo "❌ 未找到可用的服务器，请安装 Python 或 Node.js"
    echo "   访问方式：直接在浏览器中打开 index.html"
    exit 1
fi
