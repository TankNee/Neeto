var grunt=require('grunt');

//配置
grunt.config.init({
    pkg: grunt.file.readJSON('gruntPackage.json'),
    'create-windows-installer': {
        x64:{
            version:'1.0.0',
            authors:'TankNee',
            projectUrl:'',
            appDirectory:'./out/Neeto-win32-x64',//要打包的输入目录
            outputDirectory:'./out',//grunt打包后的输出目录
            exe:'Neeto.exe',
            description:'a simple markdown editor',
            noMsi:true
        }
    }
});

//加载任务
grunt.loadNpmTasks('grunt-electron-installer');

//设置为默认
grunt.registerTask('default', ['create-windows-installer'])