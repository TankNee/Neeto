const $ = require('jquery')


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


// hide other tab content
const hideTabContent = () => {
    tabs.forEach((e) =>{
        e.classList.remove('checked')
    })
    tabsContents.forEach((e) =>{
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

// 获取用户的配置文件
