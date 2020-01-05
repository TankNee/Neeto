const marked = require('marked')
const { remote, ipcRenderer } = require('electron')
const mainProcess = remote.require('./main.js')


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
        sanitize: true
    })
}

// 为输入框绑定事件
markdownView.addEventListener('keyup', (e) => {
    const content = e.target.value
    console.log(content)
    rendererMarkDownToHtml(content)
})
// 打开文件
openFileButton.addEventListener('click', () => {
    mainProcess.getFileFromUser(currentWindow);
})
// 监听频道，接收主进程传递来的消息
ipcRenderer.on('file-opened', (e, file, content) => {
    markdownView.value = content;
    rendererMarkDownToHtml(content);
})
// 新建文件
newFileButton.addEventListener('click',()=>{
    mainProcess.creatWindow();
})