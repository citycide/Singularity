import { app, Menu, shell } from 'electron';
// import { showWinSettings } from './desktopSettings';

const template = [
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            },
            {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            },
            {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            },
            {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Toggle Full Screen',
                accelerator: (() => {
                    if (process.platform === 'darwin') return 'Ctrl+Command+F';
                    return 'F11';
                })(),
                click: (item, focusedWindow) => {
                    if (focusedWindow) {
                        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                        focusedWindow.send('window:fullscreen', { state: focusedWindow.isFullScreen() });
                    }
                }
            },
            {
                label: 'Go to URL',
                accelerator: 'CmdOrCtrl+Shift+G',
                click: () => {
                    Emitter.sendToWindowsOfName('main', 'gotourl');
                }
            }
        ]
    },
    {
        label: 'Window',
        role: 'window',
        submenu: [
            {
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            },
            {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            }
        ]
    },
    {
        label: 'Help',
        role: 'help',
        submenu: [
            {
                label: 'About',
                click: () => {
                    Emitter.sendToWindowsOfName('main', 'about');
                }
            },
            {
                label: 'Issues',
                click: () => shell.openExternal('https://github.com/citycide/singularity/issues')
            },
            {
                label: 'Donate',
                click: () => shell.openExternal('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=BP83JQTLPGDHQ')
            },
            {
                label: 'Learn More',
                click: () => shell.openExternal('https://github.com/citycide/singularity')
            }
        ]
    }
];

if (process.platform === 'darwin') {
    template.unshift({
        label: 'singularity',
        submenu: [
            {
                label: 'About singularity',
                role: 'about'
            },
            /*
            {
                label: 'Preferences',
                accelerator: 'Command+,',
                click: () => showWinSettings()
            },*/
            {
                type: 'separator'
            },
            {
                label: 'Hide',
                accelerator: 'Command+H',
                role: 'hide'
            },
            {
                label: 'Hide Others',
                accelerator: 'Command+Alt+H',
                role: 'hideothers'
            },
            {
                label: 'Show All',
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: () => app.quit()
            }
        ]
    });
    // Window menu.
    template[3].submenu.push(
        {
            type: 'separator'
        },
        {
            label: 'Bring All to Front',
            role: 'front'
        }
    );
}

if (DEV_MODE) {
    template[3].submenu.push(
        {
            type: 'separator'
        }, {
            label: 'Toggle Developer Tools',
            accelerator: (() => {
                if (process.platform === 'darwin') return 'Alt+Command+I';
                return 'Ctrl+Shift+I';
            })(),
            click: (item, focusedWindow) => {
                if (focusedWindow) focusedWindow.toggleDevTools();
            }
        }
    );
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
