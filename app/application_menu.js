const {app,BrowserWindow,Menu,shell} = require('electron')
const mainProcess = require('./main')

const template = [
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Copy',
                accelerator: 'CommandOrControl+C',
                role: 'copy'
            },
            {
                label: 'Paste',
                accelerator: 'CommandOrControl+V',
                role: 'paste'
            }
        ]
    },
    {
        label: 'Tools',
        submenu: [
            {
                label: 'Reload',
                accelerator: 'CommandOrControl+R',
                role: 'reload'
            },
            {
                label: 'DevTools',
                accelerator: 'F12',
                role: 'toggledevtools'
            },
            {
                label: 'SaveAll',
                accelerator: 'CommandOrControl+S',
                click(item,focusedWindow){
                    focusedWindow.webContents.send('save-markdown')
                }
            }
        ]
    }
]
if (process.platform === 'darwin') {
    const name = 'Neeto'
    template.unshift({
        label: name
    })
}
module.exports = Menu.buildFromTemplate(template);