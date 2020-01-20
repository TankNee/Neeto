const { app, autoUpdater, dialog, BrowserWindow } = require('electron')
const isDevelopment = app.getPath('exe').indexOf('electron') !== -1;
// 自动更新的地址
// const baseUrl = 'https://download.neeto.cn'
const baseUrl = 'http://localhost:3000'
// 获取平台信息
const platform = process.platform
// 获取当前的版本号
const currentVersion = app.getVersion()
// 构建下载链接
const releaseFeed = `${baseUrl}/release/${platform}?currentVersion=${currentVersion}`
console.log(releaseFeed);

autoUpdater.setFeedURL(releaseFeed)
// if (false) {
//     console.log('[AutoUpdater]', 'In Development Mode. Skipping update')
//     // return;
// } else {
//     autoUpdater.setFeedURL(releaseFeed)
// }
// autoUpdater.addListener('update-available', () => {
//     dialog.showMessageBox({
//         type: 'question',
//         buttons: [
//             '立即安装',
//             '跳过'
//         ],
//         defaultId: 0,
//         message: `${app.getName()} has been updated!`,
//         detail: '一个更新安装包已经被下载，并且现在就可以完成更新'
//     },res=>{
//         if (res === 0) {
//             setTimeout(()=>{
//                 app.removeAllListeners('window-all-closed')
//                 BrowserWindow.getAllWindows().forEach(win => win.close())
//                 autoUpdater.quitAndInstall()
//             },0)
//         }
//     })
// })
module.exports = autoUpdater