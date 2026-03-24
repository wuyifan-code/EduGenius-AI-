import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const BACKEND_PORT = 3001;

const app = express();

// 启动后端服务（在后台运行）
console.log('Starting backend service...');
try {
  // 使用 exec 启动后台进程
  const backend = exec('cd server && node dist/main', {
    cwd: __dirname,
    env: { ...process.env, PORT: String(BACKEND_PORT) }
  });
  
  backend.stdout?.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });
  
  backend.stderr?.on('data', (data) => {
    console.error(`Backend error: ${data}`);
  });
  
  backend.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });
} catch (err) {
  console.error('Error starting backend:', err);
}

// API 代理到后端
app.use('/api', createProxyMiddleware({
  target: `http://localhost:${BACKEND_PORT}`,
  changeOrigin: true,
  secure: false,
  logLevel: 'info'
}));

// 提供前端静态文件
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API proxy: http://localhost:${PORT}/api -> http://localhost:${BACKEND_PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});
