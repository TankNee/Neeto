const electron = require('electron')
const fs = require('fs')

const { app, BrowserWindow, dialog } = electron

let mainWindow = null;

// 窗口集合
const windows = new Set()

app.on('ready', () => {
    creatWindow();
})
// 在集合中创建一个新的窗口
const creatWindow = exports.creatWindow = () => {
    let newWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        show: false
    })
    newWindow.loadFile('app/pages/index/index.html')
    newWindow.once('ready-to-show', () => {
        newWindow.show();
    })
    newWindow.on('closed', () => {
        windows.delete(newWindow)
        newWindow = null
        // app.quit()
    })
}

const getFileFromUser = exports.getFileFromUser = (targetWindow) => {
    const files = dialog.showOpenDialog(targetWindow, {
        properties: [
            'openFile'
        ],
        filters: [
            { name: 'Markdown Files', extensions: ['md'] },
            { name: 'Text Files', extensions: ['txt'] }
        ]
    })
    if (files) {
        files.then(res => {
            const file = res.filePaths[0]
            if (file) {
                openFile(targetWindow, file)
            }
            
        })
    }
}
/**
 * 读取文件内容
 */
const openFile = exports.openFile = (targetWindow, file) => {
    const content = fs.readFileSync(file).toString()
    // 向渲染进程发送消息
    targetWindow.webContents.send('file-opened', file, content);
}