const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

function createWindow() {
  console.log('Creating main window');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: true,
    icon: path.join(__dirname, 'public', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.webContents.on('did-fail-load', () => {
    console.error('Failed to load URL in mainWindow');
  });

  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });
}

function createServer() {
  let serverPath, nextAppDir;

  if (app.isPackaged) {
    // Unpacked server.js file
    serverPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'server.js');
    // .next directory is copied to resources/.next
    nextAppDir = process.resourcesPath;
  } else {
    serverPath = path.join(__dirname, 'server.js');
    nextAppDir = __dirname;
  }

  console.log('Starting server at:', serverPath);
  console.log('NEXT_APP_DIR:', nextAppDir);

  if (!fs.existsSync(serverPath)) {
    console.error('server.js not found at:', serverPath);
    app.quit();
    return;
  }

  serverProcess = spawn('node', [serverPath], {
    cwd: path.dirname(serverPath),
    env: {
      ...process.env,
      NEXT_APP_DIR: nextAppDir,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (data) => {
    const msg = data.toString();
    console.log(`Server Output: ${msg}`);

    if (msg.includes('Ready on http://localhost:3000')) {
      if (!mainWindow) {
        console.log('Server is ready, creating window');
        createWindow();
      }
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data.toString()}`);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    if (code !== 0) {
      console.log('Server exited unexpectedly, quitting app.');
      app.quit();
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server process:', err);
  });

  // Fallback: create window even if no "Ready" output after 10s
  setTimeout(() => {
    if (!mainWindow) {
      console.log('Timeout reached (10s), creating window anyway');
      createWindow();
    }
  }, 10000);
}

app.whenReady().then(() => {
  createServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (serverProcess) {
    console.log('Killing server process');
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
