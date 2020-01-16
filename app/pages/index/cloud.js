const $ = require('jquery')


// 获取顶部标签
const basicSetting = document.querySelector('#tab_setting_basic')
const uploadSetting = document.querySelector('#tab_setting_upload')
var tabs = [];
tabs.push(basicSetting)
tabs.push(uploadSetting)

// 标签内容
const basicSettingContent = document.querySelector('#tab_setting_basic_content')
const uploadSettingContent = document.querySelector('#tab_setting_upload_content')

var tabsContents = []
tabsContents.push(basicSettingContent)
tabsContents.push(uploadSettingContent)


// hide other tab content
const hideTabContent = () => {
    tabs.forEach((e) =>{
        e.classList.remove('checked')
    })
    tabsContents.forEach((e) =>{
        e.classList.remove('checked')
    })
}

basicSetting.addEventListener('click', (e) => {
    hideTabContent()
    basicSetting.classList.add('checked')
    basicSettingContent.classList.add('checked')
})

uploadSetting.addEventListener('click', (e) => {
    hideTabContent()
    uploadSetting.classList.add('checked')
    uploadSettingContent.classList.add('checked')
})