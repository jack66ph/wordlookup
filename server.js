const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 解析 PORT
let cliPort;
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--port' && process.argv[i + 1]) {
    cliPort = parseInt(process.argv[i + 1], 10);
  } else if (process.argv[i].startsWith('--port=')) {
    cliPort = parseInt(process.argv[i].split('=')[1], 10);
  }
}
const PORT = cliPort || (process.env.PORT ? parseInt(process.env.PORT, 10) : 3006);
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

const server = http.createServer((req, res) => {
  // 處理 URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // 健康檢查 API
  if (pathname === '/api/health' || pathname === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      status: 'ok',
      port: PORT,
      ips: getLocalIPs(),
      hostname: os.hostname()
    }));
  }

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const filePath = path.join(__dirname, pathname);

  // 避免路徑穿越
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback: 若找不到檔案則回傳 index.html
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (err2, content) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('404 Not Found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`   📚 查國字網頁伺服器已啟動！`);
  console.log('====================================================');
  console.log(`   🔗 本機網址: http://localhost:${PORT}`);
  const ips = getLocalIPs();
  if (ips.length > 0) {
    console.log(`   🌐 區域網路網址 (手機/平板/同網域主機可用):`);
    ips.forEach(ip => console.log(`      -> http://${ip}:${PORT}`));
  }
  console.log(`   🏷️  主機名稱: http://${os.hostname().toLowerCase()}.local:${PORT}`);
  console.log('====================================================');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[錯誤] 連接埠 ${PORT} 已被佔用！請更換 Port。`);
  } else {
    console.error('伺服器錯誤:', err);
  }
});
