const $ = require('jquery')
const { ipcRenderer } = require('electron')

// 全局变量

let SettingConfig = undefined

// 获取顶部标签
const editorSetting = document.querySelector('#tab_setting_editor')
const picbedSetting = document.querySelector('#tab_setting_picbed')
var tabs = [];
tabs.push(editorSetting)
tabs.push(picbedSetting)

// 标签内容
const editorSettingContent = document.querySelector('#tab_setting_editor_content')
const picbedSettingContent = document.querySelector('#tab_setting_picbed_content')

var tabsContents = []
tabsContents.push(editorSettingContent)
tabsContents.push(picbedSettingContent)

// 获取输入框的内容

// hide other tab content
const hideTabContent = () => {
    tabs.forEach((e) => {
        e.classList.remove('checked')
    })
    tabsContents.forEach((e) => {
        e.classList.remove('checked')
    })
}

editorSetting.addEventListener('click', (e) => {
    hideTabContent()
    editorSetting.classList.add('checked')
    editorSettingContent.classList.add('checked')
})

picbedSetting.addEventListener('click', (e) => {
    hideTabContent()
    picbedSetting.classList.add('checked')
    picbedSettingContent.classList.add('checked')
})

// 保存用户的配置文件
ipcRenderer.on('iniConfig', (e,config) => {
    console.log(config);
    
    // $('#pic_name_input').val(config.setting.picBedSetting.picBeds.webPicBed.bedsName)
    SettingConfig = config.setting
    console.log(SettingConfig);
    
})