// 模块引入
const showdown = require('showdown')
const showdownhighlight = require('showdown-highlight')
const { remote, ipcRenderer, shell, clipboard } = require('electron')
const { Menu } = remote
const mainProcess = remote.require('./main.js')
const path = require('path')
const showdownKatex = require('showdown-katex')
const SimpleMde = require('simplemde')
const mdui = require('mdui')
const fs = require('fs')
const luluDialog = require('./js/common/ui/Dialog')
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
const settingBtn = document.querySelector('#setting_btn')
const settingContent = document.querySelector('#setting')

const feedbackBtn = document.querySelector('#feedback')

pages.push(content)
pages.push(cloudContent)

const pasteToWechat = document.querySelector('#paste_to_wechat')
const revertButton = document.querySelector('#revert')


// 菜单栏按钮

const minimizeBtn = document.querySelector('#menu_minimize')
const winBtn = document.querySelector('#menu_win')
const closeBtn = document.querySelector("#menu_close")

// 侧边栏按钮
const cloudSetting = document.querySelector('#cloud')


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
    mainProcess.getFileFromUser(currentWindow)
    hidePage()
    content.classList.add('show')
})
htmlView.addEventListener('click', (e) => {
    if (e.target.href) {
        // 阻止默认行为
        e.preventDefault()
        //在默认浏览器中打开
        shell.openExternal(e.target.href)
    }
})
// 跳转到云端设置界面
cloudSetting.addEventListener('click', (e) => {
    hidePage()
    cloudContent.classList.add('show')
})
//跳转到设置界面
settingBtn.addEventListener('click', (e) => {
    hidePage()
    settingContent.classList.add('show')
})
// 新建文件
newFileButton.addEventListener('click', () => {
    hidePage()
    content.classList.add('show')
})
// 登录按钮
feedbackBtn.addEventListener('click', () => {
    new Dialog({
        title: '给我提建议',
        content: `
        <div id="dialogContent" style="display:flex;flex-direction: column;">
            <textarea class="ui-textarea" style="height: 100px; margin-bottom: 10px"></textarea>
            <input class="ui-input" placeholder="请输入您的邮箱，方便我跟您取得联系" style="height: 30px">
        </div>
        `,
        buttons: [
            {
                value: '发送',
                events: function (event) {
                    var feedbackContent = $("div#dialogContent textarea").val()
                    var mailAddress = $("div#dialogContent input").val()
                    var feedback = `<h2>From ${mailAddress}</h2><p>${feedbackContent}</p>`
                    // console.log(feedback)
                    fetch(`http://feedback.neeto.cn/feedback?feedback=${feedback}&mailAddress=${mailAddress}`)
                    .then(res =>{
                        new LightTip().success('反馈发送成功', 2000);
                    })
                    .catch(res =>{
                        new LightTip().error(`反馈发送失败${res}`, 2000);
                    })
                    event.data.dialog.remove();
                    
                }
            }
        ]
    })
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
    // pasteToWechat.disabled = !isEdited
}

// 将html内容保存为文件
pasteToWechat.addEventListener('click', () => {
    if (document.body.createTextRange) {
        var range = document.body.createTextRange();
        range.moveToElementText(htmlView);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(htmlView);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        console.warn("none");
    }
    document.execCommand("Copy");
    window.getSelection().empty()
    new LightTip().success('内容复制成功', 2000);
})

