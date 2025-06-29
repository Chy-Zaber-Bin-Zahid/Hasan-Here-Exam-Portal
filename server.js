const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Production mode
const dev = false;

// Use NEXT_APP_DIR env variable or fallback to current directory
const appDir = process.argv[2] || __dirname;

console.log('Starting Next.js server in directory:', appDir);

const app = next({ dev, dir: appDir });
const handle = app.getRequestHandler();

const port = 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
