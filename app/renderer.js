// 模块引入
const showdown = require('showdown')
const showdownhighlight = require('showdown-highlight')
const { remote, ipcRenderer, shell } = require('electron')
const { Menu } = remote
const mainProcess = remote.require('./main.js')
const path = require('path')
const showdownKatex = require('showdown-katex')
const SimpleMde = require('simplemde')
const mdui = require('mdui')
const fs = require('fs')

// 几个状态参量
let filePath = null;
let pages = []
let originalContent = '';
let isDocChanged = false
let baseConfig = {
    baseUrl: 'http://localhost:8080/api',
    picBedUrl: 'https://pic.tanknee.cn/api/upload',
    testToken: 'bdaaa8a43a8e8e58ce46cd5aa38848d6'
}
// 获取页面中的各个控件
const markdownView = document.querySelector('.CodeMirror')
const htmlView = document.querySelector('#html')
const windowTitle = document.querySelector('#file_name')

const newFileButton = document.querySelector('#new_file')
const openFileButton = document.querySelector('#files')
const saveMarkdownButton = document.querySelector('#save')
const icon = document.querySelector('#icon_img')
//内容显示页面
const content = document.querySelector('#content')
const cloudContent = document.querySelector('#cloud_setting')
pages.push(content)
pages.push(cloudContent)
console.log(pages)
const saveHtmlButton = document.querySelector('#save_html')
const revertButton = document.querySelector('#revert')


// 菜单栏按钮

const minimizeBtn = document.querySelector('#menu_minimize')
const winBtn = document.querySelector('#menu_win')
const closeBtn = document.querySelector("#menu_close")

// 侧边栏按钮
const cloudSetting = document.querySelector('#cloud')

const contextMenuTemplate = [
    {
        label: 'Select All',
        role: 'selectall'
    },
    {
        label: 'Open File',
        click() {
            mainProcess.getFileFromUser(currentWindow)
        }
    }
]
// 获取当前窗体的引用
const currentWindow = remote.getCurrentWindow();

//定义一个函数用于重复执行HTML渲染的任务
const rendererMarkDownToHtml = (markdown) => {
    const converter = new showdown.Converter({
        extensions: [
            showdownhighlight,
            showdownKatex({
                delimiters: [
                    { left: "$$", right: "$$", display: false }, // katex default
                    { left: '~', right: '~', display: false, asciimath: true },
                    { left: '$', right: '$', display: false, asciimath: true }
                ]
            }),
        ],
        tables: true,
        tasklists: true
    });
    htmlView.innerHTML = converter.makeHtml(markdown)

    // const markit = new markdownit();
    // htmlView.innerHTML = markit.render(markdown)
}
icon.addEventListener('click', function () {
    shell.openExternal("https://neeto.cn")
})
const hidePage = () => {
    pages.forEach(e => {
        e.classList.remove('show')
    })
}


minimizeBtn.addEventListener('click', (e) => {
    currentWindow.minimize()
})
winBtn.addEventListener('click', (e) => {
    if (currentWindow.isMaximized()) {
        currentWindow.restore()
    } else {
        currentWindow.maximize()
    }

})
closeBtn.addEventListener('click', (e) => {
    currentWindow.close()
})

// 打开文件
openFileButton.addEventListener('click', () => {
    mainProcess.getFileFromUser(currentWindow);
})
htmlView.addEventListener('click', (e) => {
    if (e.target.href) {
        // 阻止默认行为
        e.preventDefault()
        //在默认浏览器中打开
        shell.openExternal(e.target.href)
    }
})
cloudSetting.addEventListener('click', (e) => {
    hidePage()
    cloudContent.classList.add('show')
})

// 新建文件
newFileButton.addEventListener('click', () => {
    hidePage()
    content.classList.add('show')
    // content.innerHTML = loadContent(`${__dirname}/template/content.html`)
    // currentWindow.webContents.send('page-reload')
})
ipcRenderer.on('page-reload', () => {

})

// 基于打开的文件更新窗口标题
const updateUserInterface = (isEdited) => {
    let title = 'Neeto'
    if (filePath) {
        // 如果有文件被打开，那么就将文件名放在标题的前面
        title = `${path.basename(filePath)} - ${title}`
    }
    if (isEdited) {
        title = `${title} *`;
    }
    windowTitle.innerHTML = title
    if (process.platform == 'darwin') {
        currentWindow.setDocumentEdited(isEdited)
    }
    saveMarkdownButton.disabled = !isEdited
    // saveHtmlButton.disabled = !isEdited
}

// 将html内容保存为文件
saveHtmlButton.addEventListener('click', () => {
    // saveMarkdownButton.disabled = !isDocChanged
    mainProcess.saveHtml(currentWindow, htmlView.innerHTML)
})

