const electron = require('electron')
const fs = require('fs')

const { app, BrowserWindow, dialog, Menu, globalShortcut } = electron
const applicationMenu = require('./application_menu')

let mainWindow = null;
let isDocumentEdited_win = false;

// 窗口集合
const windows = new Set()
// 打开的文件
const openFiles = new Map()

global.baseConfig = {
    baseUrl: 'http://localhost:8080/api',
    picBedUrl: 'https://pic.tanknee.cn/api/upload'
}

app.on('ready', () => {
    let curwindow = creatWindow();
    globalShortcut.register('CommandOrControl+R', () => {
        curwindow.webContents.reload()
    })
    globalShortcut.register('F3', () => {
        curwindow.webContents.openDevTools()
    })
    curwindow.webContents.openDevTools()
    
})
app.on('will-finish-launching', () => {
    // 外界触发的文件打开事件
    app.on('open-file', (e, file) => {
        const win = creatWindow()
        win.once('ready-to-show', () => {
            openFile(win, file);
        })
    })
})
app.on('will-quit',()=>{
    globalShortcut.unregister()
})
// 在集合中创建一个新的窗口
const creatWindow = exports.creatWindow = () => {
    let newWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        show: false,
        titleBarStyle: 'hidden',
        frame: false,
    })
    newWindow.loadFile('app/pages/index/index.html')
    // newWindow.loadFile('app/pages/editor/editor.html')

    newWindow.once('ready-to-show', () => {
        newWindow.show();
    })
    newWindow.on('close', (e) => {
        console.log(1)
        flag = isDocumentEdited_win
        if (newWindow.isDocumentEdited() || isDocumentEdited_win) {
            e.preventDefault()
            const result = dialog.showMessageBox(newWindow, {
                type: 'warning',
                message: '是否保存您的更改',
                buttons: [
                    '离开',
                    '取消'
                ],
                defaultId: 0,
                cancelId: 1
            })
            result.then(res => {
                if (res.response === 0) {
                    newWindow.destroy()
                }
            })
        }
    })
    newWindow.on('closed', () => {
        windows.delete(newWindow)
        stopWatchingFile(newWindow)
        newWindow = null
        // app.quit()
    })
    windows.add(newWindow)
    return newWindow
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
    app.addRecentDocument(file)
    targetWindow.setRepresentedFilename(file)
    // 开启文件监视器
    startWatchingFile(targetWindow, file)
    // 向渲染进程发送消息
    targetWindow.webContents.send('file-opened', file, content);
}
/**
 * 将文本内容保存为HTML文件
 */
const saveHtml = exports.saveHtml = (targetWindow, content) => {
    const file = dialog.showSaveDialog(targetWindow, {
        title: '保存为HTML',
        defaultPath: app.getPath('documents'),
        filters: [
            { name: 'HTML 文件', extensions: ['html', 'htm'] }
        ]
    })
    if (file) {
        console.log(file)
        file.then(res => {
            console.log(res)
            if (res.filePath !== '') {
                fs.writeFileSync(res.filePath, content);
            }
        }).catch(res => {
            console.log(res)
        })
    }
}
/**
 * 保存当前的文件为markdown
 * @param targetWindow 当前窗口
 * @param file 当前文件的路径
 * @param content 文本内容
 */
const saveMarkdown = exports.saveMarkdown = (targetWindow, file, content) => {
    // 如果是全新的文件，那么就让用户选择存储的路径
    if (!file) {
        file = dialog.showSaveDialog(targetWindow, {
            title: '保存为Markdown',
            defaultPath: app.getPath('documents'),
            filters: [
                { name: 'Markdown 文件', extensions: ['md'] }
            ]
        })
    }
    // 如果是新文件，那么获取到的将会是一个对象而不是一个简单的路径，所以需要一定的处理才能获得相应的路径
    if (!(file instanceof Object)) {
        fs.writeFileSync(file, content)
    } else {
        file.then(res => {
            console.log(res)
            fs.writeFileSync(res.filePath, content);
            openFile(targetWindow, res.filePath)
        })
    }
}
/**
 * 监控文件的活动
 * @param {*} targetWindow 
 * @param {*} file 
 */
const startWatchingFile = (targetWindow, file) => {
    stopWatchingFile(targetWindow)
    const watcher = fs.watch(file, (e) => {
        if (e === 'change') {
            console.log(1)
            const content = fs.readFileSync(file, 'utf-8')
            console.log('main.js:')
            console.log(content)
            targetWindow.webContents.send('file-changed', file, content)
        }
    })

    openFiles.set(targetWindow, watcher)
}
/**
 * 停止文件监视器
 * @param {*} targetWindow 
 */
const stopWatchingFile = (targetWindow) => {
    // has方法要求传入一个键，然后检索这个键是否存在--键值对中键是唯一的，而值并不是唯一的
    if (openFiles.has(targetWindow)) {
        console.log(openFiles.get(targetWindow))
        openFiles.get(targetWindow).close();// 停止文件监控器
        openFiles.delete(targetWindow);//删除与窗口相关的文件监控器
    }
}
/**
 * 判断是否修改
 */
const isDocumentEditedWindows = exports.isDocumentEditedWindows = (isEdited) => {
    isDocumentEdited_win = isEdited;
    return isDocumentEdited_win;
}