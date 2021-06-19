const {app,BrowserWindow,Menu,globalShortcut,ipcMain,shell} = require("electron");
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');

let iconv = require('iconv-lite');
const os = require('os');
const path = require('path');

process.env.NODE_ENV = "development";

const isDev = process.env.NODE_ENV !== "production";
const isMac = process.platform ==="darwin";
let win;
let aboutWin;
function createWindow () {
   win = new BrowserWindow({
    title:"ImageShrink",
    width: isDev?800 :1000,
    height: 700,
    icon:`${__dirname}/assets/icons/a10.png`,
    resizable:isDev,
    backgroundColor:"skyBlue",
    webPreferences:{
      nodeIntegration:true,
      contextIsolation:false
    }
  })
  isDev&&win.webContents.openDevTools()
  win.loadFile('./app/index.html')
}
function createAboutWindow () {
  win = new BrowserWindow({
   title:"ImageShrink",
   width: 300,
   height: 300,
   resizable:isDev,
 })
 win.loadFile('./app/about.html')
}

const menu = [
  ...(isMac?[{role:"appMenu"}]:[]),
  {
    label:isMac?app.name:"help",
    submenu:[
      {
        label:"About",
        click:createAboutWindow
      }
    ]
  },
  {
    label:"File",
    submenu:[
      {
        label:"Quit",
        click:()=>app.quit(),
        accelerator:"CmdOrCtrl+W"
      }
    ]
  },
  ...(isDev?[{
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  }]:[]),
];
ipcMain.on("image:miniSize",(e,option)=>{
  // option.dest = path.join(os.homedir(),"imageShrink");
  // option.dest = option.savePath;
  // shrinkImage(option)
  // console.log(option)
 
  option.forEach(async (item,i)=>{
    await shrinkImage(item,i+1===option.length)
  })
})
async function shrinkImage({imagePath,quality,savePath},success=false){
  try{
    const pngQuality = quality/100;
    const files = await imagemin([slash(imagePath)],{
      destination:savePath,
      plugins:[
        imageminMozjpeg({quality}),
        imageminPngquant({
          quality:[pngQuality,pngQuality]
        })
      ]
    });
    if(success){
      shell.openPath(savePath);
      win.webContents.send("image:done");
    }
  }catch(e){
    console.log(e)
  }
}
app.on("ready",()=>{
  createWindow();
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);
  /* 全局快捷键 */
  globalShortcut.register("CmdOrCtrl+R",()=>win.reload());
  globalShortcut.register(isMac?"Command+Alt+I":"Ctrl+Alt+I",()=>win.toggleDevTools())

  
  win.on("close",()=>{
    win= null;
  })
})
app.on("activate",()=>{
  if(BrowserWindow.getAllWindows().length === 0){
    createWindow()
  }
})

app.on("window-all-closed",()=>{
  if(!isMac){
    app.quit()
  }
})