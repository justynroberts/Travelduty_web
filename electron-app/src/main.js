const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let tray;
let pythonProcess;
const API_PORT = 5000;

// Python backend process
function startPythonBackend() {
    const pythonScript = path.join(__dirname, '../../main_web.py');
    const python = process.platform === 'win32' ? 'python' : 'python3';

    console.log('Starting Python backend...');
    pythonProcess = spawn(python, [pythonScript, '--host', '127.0.0.1', '--port', API_PORT.toString()]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });

    // Wait for server to start
    return new Promise((resolve) => {
        setTimeout(resolve, 3000);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../assets/icon.png'),
        backgroundColor: '#667eea',
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 15, y: 15 }
    });

    // Load the app
    mainWindow.loadURL(`http://127.0.0.1:${API_PORT}`);

    // Open DevTools in development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    // Handle window close - minimize to tray instead
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray() {
    // Create tray icon (you'll need to add an icon file)
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Dashboard',
            click: () => {
                mainWindow.show();
                mainWindow.webContents.send('navigate', '/');
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Pause Scheduler',
            id: 'pause',
            click: async () => {
                await fetch(`http://127.0.0.1:${API_PORT}/api/control`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'pause' })
                });
            }
        },
        {
            label: 'Resume Scheduler',
            id: 'resume',
            click: async () => {
                await fetch(`http://127.0.0.1:${API_PORT}/api/control`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'resume' })
                });
            }
        },
        {
            label: 'Trigger Commit Now',
            click: async () => {
                await fetch(`http://127.0.0.1:${API_PORT}/api/control`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'trigger' })
                });
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Git Deploy Scheduler');
    tray.setContextMenu(contextMenu);

    // Show window on tray icon click
    tray.on('click', () => {
        mainWindow.show();
    });
}

// App lifecycle
app.whenReady().then(async () => {
    // Start Python backend
    await startPythonBackend();

    // Create main window
    createWindow();

    // Create system tray
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Don't quit on window close (we have tray)
    if (process.platform !== 'darwin') {
        // On non-macOS, keep app running in background
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
});

app.on('quit', () => {
    // Kill Python process
    if (pythonProcess) {
        pythonProcess.kill();
    }
});

// IPC handlers
ipcMain.handle('get-api-port', () => {
    return API_PORT;
});

ipcMain.handle('minimize-to-tray', () => {
    mainWindow.hide();
});

ipcMain.handle('open-devtools', () => {
    mainWindow.webContents.openDevTools();
});
