const mde = require('simplemde')

var markdown = new mde({
    element: document.getElementById("mde"),
    autoDownloadFontAwesome: true,
    status: true
})