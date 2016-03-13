$(document).ready( function() {
    var gui = require('nw.gui');
    var win = gui.Window.get();

    var btnOpenAlerts = $('a#openAlerts');
    var btnWinRefresh = $("#winRefresh");
    var btnWinMinimize = $("#winMinimize");
    var btnWinMaximize = $("#winMaximize");
    var btnWinClose = $("#winClose");

    btnOpenAlerts.click(function() {
        var winAlerts = gui.Window.open('http://localhost:2016/overlays', {
            position: 'center',
            focus: true,
            width: 780,
            height: 250
        });
        winAlerts.on ('loaded', function(){
            log('SYS: Opened alerts window.');
            // var document = winAlerts.window.document;
        });
        return false;
    });

    btnWinRefresh.click(function () {
        win.reload();
    });
    btnWinMinimize.click(function () {
        win.minimize();
    });

    var isMaximized = false;
    win.on('maximize', function() {
        isMaximized = true;
        console.log('SYS: Window maximized. isMaximized set to ' + isMaximized);
    });
    win.on('unmaximize', function() {
        isMaximized = false;
        console.log('SYS: Window unmaximized. isMaximized set to ' + isMaximized);
    }).on('restore', function() {
        isMaximized = false;
        console.log('SYS: Window unmaximized. isMaximized set to ' + isMaximized);
    });

    btnWinMaximize.click(function () {
        isMaximized ? win.restore() : win.maximize();
    });
    btnWinClose.click(function () {
        win.hide();
        console.log('collapsing the singularity...');
        win.close(true);
        /*
         setTimeout(function () {
         win.close(true);
         }, 5000);
         */
    });

});