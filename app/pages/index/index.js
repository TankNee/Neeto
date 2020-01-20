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
const $ = require('jquery')
const lightTip = require('../../js/common/ui/LightTip')
// 几个状态参量
let filePath = null;
let originalContent = '';
let isDocChanged = false
// let baseConfig = {
//     baseUrl: 'http://localhost:8080/api',
//     picBedUrl: 'https://pic.tanknee.cn/api/upload',
//     token: 'bdaaa8a43a8e8e58ce46cd5aa38848d6'
// }
let baseConfig = {
    baseUrl: undefined,
    picBedUrl: undefined,
    token: undefined
}
/**
 * 右键菜单
 */
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

const currentWindow = remote.getCurrentWindow();
const markdownView = document.querySelector('.CodeMirror-scroll')
const htmlView = document.querySelector('#html')
const saveMarkdownButton = document.querySelector('#save')
const revertButton = document.querySelector('#revert')
const windowTitle = document.querySelector('#file_name')



var smde = new SimpleMde({
    element: document.getElementById("markdown"),
    autoDownloadFontAwesome: true,
    status: false,
    toolbar: [
        "bold", "italic", "strikethrough", "heading", "code", "quote", "unordered-list",
        "ordered-list", "clean-block", "link", "image", "table", "horizontal-rule", "fullscreen", "guide"
    ]
})
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
        tasklists: true,
        strikethrough: true,
        ghCodeBlocks: true
    });
    htmlView.innerHTML = converter.makeHtml(markdown)
}
/**
 * 监听change事件
 */
smde.codemirror.on("change", function () {
    isDocChanged = true && (originalContent !== smde.value())
    const content = smde.value()
    rendererMarkDownToHtml(content)
    updateUserInterface(isDocChanged);
    mainProcess.isDocumentEditedWindows(isDocChanged)
    saveMarkdownButton.disabled = !isDocChanged
});
/**
 * 监听右键事件
 */
smde.codemirror.on("contextmenu", function (e) {
    const mdContextMenu = Menu.buildFromTemplate(contextMenuTemplate)
    mdContextMenu.popup()
});
/**
 * 简单的实现代码补全功能
 */
smde.codemirror.on('inputRead', (editor, e) => {
    if (e.text.length === 1) {
        if (e.text[0] == '[') {
            smde.codemirror.replaceSelection(']')
        } else if (e.text[0] == '{') {
            smde.codemirror.replaceSelection('}')
        } else if (e.text[0] == '(') {
            smde.codemirror.replaceSelection(')')
        }
    }

})

/**
 * 实现同步滚动
 */
smde.codemirror.on('scroll', (editor, e) => {
    $('#html').scrollTop(smde.codemirror.getScrollInfo().top);
})

htmlView.addEventListener('click', (e) => {
    if (e.target.href) {
        // 阻止默认行为
        e.preventDefault()
        //在默认浏览器中打开
        shell.openExternal(e.target.href)
    }
})
// 将markdown文件保存下来
saveMarkdownButton.addEventListener('click', () => {
    originalContent = smde.value()
    isDocChanged = false
    updateUserInterface(isDocChanged)
    mainProcess.isDocumentEditedWindows(isDocChanged)
    mainProcess.saveMarkdown(currentWindow, filePath, smde.value())
    new LightTip().success('保存成功', 2000);
})

// 回滚
revertButton.addEventListener('click', () => {
    isDocChanged = false
    smde.value(originalContent)
    updateUserInterface(false)
    mainProcess.isDocumentEditedWindows(false)
    rendererMarkDownToHtml(originalContent)
})
// 拖拽文件
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('dragleave', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());
smde.codemirror.on("dragover", function (editor, e) {
    const file = getDraggedFile(e)
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
            dropFiles.forEach(file => {
                const formdata = new FormData()
                formdata.append('image', file)
                console.log(baseConfig)
                if (baseConfig.picBedUrl) {
                    uploadToPicBeds(formdata, baseConfig.picBedUrl, baseConfig.token)
                        .then(res => {
                            console.log(res)
                            var finalUrl = `<img src="${res}">`
                            smde.codemirror.doc.replaceSelection(finalUrl)
                            rendererMarkDownToHtml(smde.value())
                            new LightTip().success('图床图片上传成功', 2000);
                        })
                        .catch(res => {
                            console.log(res);
                            new LightTip().error('图床图片上传失败，请检查图床配置', 4000);
                            finalUrl = `![${file.name}](${file.path})`
                            smde.codemirror.doc.replaceSelection(finalUrl)
                            rendererMarkDownToHtml(smde.value())
                        })

                } else {
                    var finalUrl = `![${file.name}](${file.path})`
                    smde.codemirror.doc.replaceSelection(finalUrl)
                    rendererMarkDownToHtml(smde.value())
                    new LightTip().success('本地图片添加成功', 2000);


                }
            });
        } else {
            mainProcess.openFile(currentWindow, file.path)
        }
    } else {
        new LightTip().error('该文件类型暂时无法上传', 4000);
    }
    isDocChanged = false
    saveMarkdownButton.disabled = !isDocChanged
});
/**
 * 将文件上传到图床
 * @param {Object} formdata 图片文件对象
 */
const uploadToPicBeds = (formdata, picBedUrl, token = '') => {
    return new Promise((resolve, reject) => {
        fetch(picBedUrl, {
            method: 'post',
            body: formdata,
            headers: {
                token: token
            }
        })
            .catch(res => {
                reject(res)
            })
            .then(res => res.json())
            .then(res => {
                if (res.code !== 200) {
                    reject(res)
                }
                resolve(res.data.url)
            })
            .catch(res => {
                reject(res)
            })
    })
}



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
ipcRenderer.on('file-changed', (e, file, content, type = 'markdownFile') => {
    if (type === 'markdownFile') {
        renderFile(file, content)
    } else {
        baseConfig.picBedUrl = content.setting.picBedSetting.picBeds.webPicBed.bedsUrl
        baseConfig.token = content.setting.picBedSetting.picBeds.webPicBed.bedsToken
        console.log(content);

        console.log(baseConfig);

    }

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



const getDraggedFile = (e) => {
    return e.dataTransfer.items[0]
}
const getDroppedFile = (e) => {
    return e.dataTransfer.files[0]
}
const fileTypeIsSupported = (file) => {
    // console.log(file)
    return ['text/plain', 'text/x-markdown', 'text/md', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'].includes(file.type)
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
// 保存用户的配置文件
ipcRenderer.on('iniConfig', (e, config) => {
    console.log(config);
    baseConfig.picBedUrl = config.setting.picBedSetting.picBeds.webPicBed.bedsUrl
    baseConfig.token = config.setting.picBedSetting.picBeds.webPicBed.bedsToken
})