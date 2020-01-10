// 模块引入
const showdown = require('showdown')
const showdownhighlight = require('showdown-highlight')
const { remote, ipcRenderer } = require('electron')
const { Menu } = remote
const mainProcess = remote.require('./main.js')
const path = require('path')
const showdownKatex = require('showdown-katex')
const SimpleMde = require('simplemde')

var smde = new SimpleMde({
    element: document.getElementById("markdown"),
    autoDownloadFontAwesome: true,
    status: false,
    toolbar: [
        "bold", "italic", "strikethrough", "heading", "code", "quote", "unordered-list",
        "ordered-list", "clean-block", "link", "image", "table", "horizontal-rule", "preview", "side-by-side", "fullscreen", "guide"
    ]
})

// 几个状态参量
let filePath = null;
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
const newFileButton = document.querySelector('#new_file')
const openFileButton = document.querySelector('#files')
const saveMarkdownButton = document.querySelector('#save')
const saveHtmlButton = document.querySelector('#save_html')
const revertButton = document.querySelector('#revert')
const showFileButton = document.querySelector('#show_file')
const openInDefaultButton = document.querySelector('#open_in_default')

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

// 为输入框绑定事件
smde.codemirror.on("change", function () {
    isDocChanged = true && (originalContent !== smde.value())
    const content = smde.value()
    rendererMarkDownToHtml(content)
    updateUserInterface(isDocChanged);
    mainProcess.isDocumentEditedWindows(isDocChanged)
    saveMarkdownButton.disabled = !isDocChanged
});
smde.codemirror.on("contextmenu", function (e) {
    const mdContextMenu = Menu.buildFromTemplate(contextMenuTemplate)
    mdContextMenu.popup()
});





// markdownView.addEventListener('keyup', (e) => {
//     isDocChanged = true && (originalContent !== e.target.value)
//     const content = e.target.value
//     rendererMarkDownToHtml(content)
//     updateUserInterface(isDocChanged);
//     mainProcess.isDocumentEditedWindows(isDocChanged)
//     saveMarkdownButton.disabled = !isDocChanged
// })
// 实现括号的自动补全
// markdownView.addEventListener('keyup', (e) => {
//     var lastChar = e.target.value.substring(e.target.value.length - 1)
//     if (lastChar === '{' && e.keyCode == 219) {
//         e.target.value += '}'
//     }
//     if (lastChar === '[' && e.keyCode == 219) {
//         e.target.value += ']'
//     }
//     if (lastChar === '(' && e.keyCode == 57) {
//         e.target.value += ')'
//     }
// })
// 实现右键菜单
// markdownView.addEventListener('contextmenu', (e) => {
//     e.preventDefault();
//     const mdContextMenu = Menu.buildFromTemplate(contextMenuTemplate)
//     mdContextMenu.popup()
// })

// 打开文件
openFileButton.addEventListener('click', () => {
    mainProcess.getFileFromUser(currentWindow);
})

// 监听file-opened频道，接收主进程传递来的消息
ipcRenderer.on('file-opened', (e, file, content) => {
    if (isDocChanged) {
        const result = remote.dialog.showMessageBox(currentWindow, {
            type: 'warning',
            title: '是否覆盖您的修改',
            message: '您有未保存的文件，是否要覆盖该文件？',
            buttons: [
                'Yes',
                'Cancel'
            ],
            defaultId: 0,
            cancelId: 1
        })
        result.then(res => {
            if (res.response === 1) {
                return;
            } else {
                renderFile(file, content)
            }
        })

    } else {
        renderFile(file, content)
    }
})
/**
 * 监听file-changed频道
 */
ipcRenderer.on('file-changed', (e, file, content) => {
    renderFile(file, content)
})
/**
 * 监听save-markdown频道
 */
ipcRenderer.on('save-markdown', (e, file, content) => {
    originalContent = markdownView.value
    isDocChanged = false
    updateUserInterface(isDocChanged)
    mainProcess.isDocumentEditedWindows(isDocChanged)
    mainProcess.saveMarkdown(currentWindow, filePath, markdownView.value)
    saveMarkdownButton.disabled = !isDocChanged
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
        title = `${title} *`;
    }
    currentWindow.setTitle(title)
    if (process.platform == 'darwin') {
        currentWindow.setDocumentEdited(isEdited)
    }


    saveMarkdownButton.disabled = !isEdited
    // saveHtmlButton.disabled = !isEdited
}

// 将html内容保存为文件
// saveHtmlButton.addEventListener('click', () => {
//     saveMarkdownButton.disabled = !isDocChanged
//     mainProcess.saveHtml(currentWindow, htmlView.innerHTML)
// })

// 将markdown文件保存下来
saveMarkdownButton.addEventListener('click', () => {
    originalContent = markdownView.value
    isDocChanged = false
    updateUserInterface(isDocChanged)
    mainProcess.isDocumentEditedWindows(isDocChanged)
    mainProcess.saveMarkdown(currentWindow, filePath, smde.value())
})

// 回滚
// revertButton.addEventListener('click', () => {
//     isDocChanged = false
//     markdownView.value = originalContent
//     updateUserInterface(false)
//     mainProcess.isDocumentEditedWindows(false)
//     rendererMarkDownToHtml(originalContent)
//     saveMarkdownButton.disabled = !isDocChanged
// })

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
    // console.log(file)
    return ['text/plain', 'text/x-markdown', 'text/md', 'image/png', 'image/jpeg', 'image/jpg', ''].includes(file.type)
}
smde.codemirror.on("dragover", function (editor, e) {
    const file = getDraggedFile(e)
    if (fileTypeIsSupported(file)) {
        markdownView.classList.add('drag-over')
    } else {
        markdownView.classList.add('drag-error')
    }
});
smde.codemirror.on("drop", function (editor, e) {
    const file = getDroppedFile(e)
    var df = e.dataTransfer
    // 文件对象数组
    var dropFiles = []
    console.log(file)
    if (fileTypeIsSupported(file)) {
        if (file.type.indexOf("image") !== -1) {
            // 获取图片的File对象
            if (df.items !== undefined) {
                // Chrome有items属性，对Chrome的单独处理
                for (var i = 0; i < df.items.length; i++) {
                    var item = df.items[i];
                    console.log(item.getAsFile())
                    // 用webkitGetAsEntry禁止上传目录
                    if (item.kind === "file" && item.webkitGetAsEntry().isFile) {
                        var dropFile = item.getAsFile();
                        dropFiles.push(dropFile);
                    }
                }
            }
            // 上传到图床
            const urlResult = []
            dropFiles.forEach(file => {
                const formdata = new FormData()
                formdata.append('image', file)
                fetch(baseConfig.picBedUrl, {
                    method: 'post',
                    body: formdata,
                    headers: {
                        token: baseConfig.testToken
                    }
                })
                    .then(res => res.json())
                    .then(res => {
                        finalUrl = `<img src="${res.data.url}">`
                        console.log(res.data.url)
                        var tempCon = smde.value()
                        tempCon += finalUrl
                        smde.value(tempCon)
                        rendererMarkDownToHtml(smde.value())
                        urlResult.push(res.data.url)
                    })
            });
            console.log(urlResult)
        } else {
            mainProcess.openFile(currentWindow, file.path)
        }
    } else {
        alert("这种文件暂时不支持编辑")
    }
    isDocChanged = false
    saveMarkdownButton.disabled = !isDocChanged
});



// markdownView.addEventListener('dragover', (e) => {
//     const file = getDraggedFile(e)
//     console.log(file)
//     if (fileTypeIsSupported(file)) {
//         markdownView.classList.add('drag-over')
//     } else {
//         markdownView.classList.add('drag-error')
//     }
// })
// markdownView.addEventListener('drop', (e) => {
//     const file = getDroppedFile(e)
//     var df = e.dataTransfer
//     // 文件对象数组
//     var dropFiles = []
//     console.log(file)
//     if (fileTypeIsSupported(file)) {
//         if (file.type.indexOf("image") !== -1) {
//             // 获取图片的File对象
//             if (df.items !== undefined) {
//                 // Chrome有items属性，对Chrome的单独处理
//                 for (var i = 0; i < df.items.length; i++) {
//                     var item = df.items[i];
//                     console.log(item.getAsFile())
//                     // 用webkitGetAsEntry禁止上传目录
//                     if (item.kind === "file" && item.webkitGetAsEntry().isFile) {
//                         var dropFile = item.getAsFile();
//                         dropFiles.push(dropFile);
//                     }
//                 }
//             }
//             // 上传到图床
//             const urlResult = []
//             dropFiles.forEach(file => {
//                 const formdata = new FormData()
//                 formdata.append('image', file)
//                 fetch(baseConfig.picBedUrl, {
//                     method: 'post',
//                     body: formdata,
//                     headers: {
//                         token: baseConfig.testToken
//                     }
//                 })
//                     .then(res => res.json())
//                     .then(res => {
//                         finalUrl = `<img src="${res.data.url}">`
//                         console.log(res.data.url)
//                         markdownView.value += finalUrl
//                         rendererMarkDownToHtml(markdownView.value)
//                         urlResult.push(res.data.url)
//                     })
//             });
//             console.log(urlResult)
//         } else {
//             mainProcess.openFile(currentWindow, file.path)
//         }
//     } else {
//         alert("这种文件暂时不支持编辑")
//     }
//     isDocChanged = false
//     saveMarkdownButton.disabled = !isDocChanged
//     markdownView.classList.remove('drag-over')
//     markdownView.classList.remove('drag-error')
// })
// markdownView.addEventListener('dragleave', () => {
//     // 清除样式
//     markdownView.classList.remove('drag-over')
//     markdownView.classList.remove('drag-error')
// })
/**
 * 上传到图床
 * @param {*} files 
 */
const uploadToPicBed = (files) => {
    return new Promise((resolve, reject) => {
        const urlResult = []
        files.forEach(file => {
            const formdata = new FormData()
            formdata.append('image', file)
            fetch(baseConfig.picBedUrl, {
                method: 'post',
                body: formdata,
                headers: {
                    token: baseConfig.testToken
                }
            })
                .then(res => {
                    // urlResult.push(res.json().data.url)
                })
        });
        resolve(urlResult)
    }

    )

}
/**
 * 重构显示一个新文件的操作
 * @param {*} file 
 * @param {*} content 
 */
const renderFile = (file, content) => {
    filePath = file
    originalContent = content

    smde.value(content)
    rendererMarkDownToHtml(content)

    isDocChanged = false
    updateUserInterface(isDocChanged)
    mainProcess.isDocumentEditedWindows(isDocChanged)
    saveMarkdownButton.disabled = !isDocChanged
}