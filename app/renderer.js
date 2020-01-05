const marked = require('marked')
const { remote, ipcRenderer } = require('electron')
const mainProcess = remote.require('./main.js')
const path = require('path')

let filePath = null;
let originalContent = '';

// 获取页面中的各个控件
const markdownView = document.querySelector('#markdown')
const htmlView = document.querySelector('#html')
const newFileButton = document.querySelector('#new_file')
const openFileButton = document.querySelector('#open_file')
const saveMarkdownButton = document.querySelector('#save_markdown')
const saveHtmlButton = document.querySelector('#save_html')
const revertButton = document.querySelector('#revert')
const showFileButton = document.querySelector('#show_file')
const openInDefaultButton = document.querySelector('#open_in_default')

// 获取当前窗体的引用
const currentWindow = remote.getCurrentWindow();

//定义一个函数用于重复执行HTML渲染的任务
const rendererMarkDownToHtml = (markdown) => {
    htmlView.innerHTML = marked(markdown, {
        sanitize: false
    })
}

// 为输入框绑定事件
markdownView.addEventListener('keyup', (e) => {
    const content = e.target.value
    rendererMarkDownToHtml(content)
    updateUserInterface(content !== originalContent);
})

// 打开文件
openFileButton.addEventListener('click', () => {
    mainProcess.getFileFromUser(currentWindow);
})

// 监听频道，接收主进程传递来的消息
ipcRenderer.on('file-opened', (e, file, content) => {
    filePath = file
    originalContent = content
    markdownView.value = content;
    rendererMarkDownToHtml(content);
    updateUserInterface();
})

// 新建文件
newFileButton.addEventListener('click', () => {
    mainProcess.creatWindow();
})

// 基于打开的文件更新窗口标题
const updateUserInterface = (isEdited) => {
    let title = 'Neeto'
    if (filePath) {
        // 如果有文件被打开，那么就将文件名放在标题的前面
        title = `${path.basename(filePath)} - ${title}`
    }
    if (isEdited) {
        title = `${title} (Edited)`;
    }
    currentWindow.setTitle(title)
    if (process.platform == 'darwin') {
        currentWindow.setDocumentEdited(isEdited)
    }


    saveMarkdownButton.disabled = !isEdited
    // saveHtmlButton.disabled = !isEdited
}

// 将html内容保存为文件
saveHtmlButton.addEventListener('click', () => {
    mainProcess.saveHtml(currentWindow, htmlView.innerHTML)
})

// 将markdown文件保存下来
saveMarkdownButton.addEventListener('click', () => {
    originalContent = markdownView.value
    mainProcess.saveMarkdown(currentWindow, filePath, markdownView.value)
})

// 回滚
revertButton.addEventListener('click', () => {
    markdownView.value = originalContent
    rendererMarkDownToHtml(originalContent)
})

// 拖拽文件
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('dragleave', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());

const getDraggedFile = (e) => {
    return e.dataTransfer.items[0]
}
const getDroppedFile = (e) => {
    return e.dataTransfer.files[0]
}
const fileTypeIsSupported = (file) => {
    console.log(file)
    return ['text/plain','text/x-markdown','text/md','image/png','image/jpeg','image/jpg',''].includes(file.type)
}
markdownView.addEventListener('dragover', (e) => {
    const file = getDraggedFile(e)
    if (fileTypeIsSupported(file)) {
        markdownView.classList.add('drag-over')
    } else {
        markdownView.classList.add('drag-error')
    }
})
markdownView.addEventListener('drop',(e)=>{
    const file = getDroppedFile(e)
    if (fileTypeIsSupported(file)) {
        mainProcess.openFile(currentWindow,file.path)
    } else {
        alert("这种文件暂时不支持编辑")
    }
    markdownView.classList.remove('drag-over')
    markdownView.classList.remove('drag-error')
})
markdownView.addEventListener('dragleave', () => {
    // 清除样式
    markdownView.classList.remove('drag-over')
    markdownView.classList.remove('drag-error')
})