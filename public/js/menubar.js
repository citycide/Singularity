$(document).ready( function() {
    if (isNwjs) {
        var win = nw.Window.get();

        $('.dropdown-toggle').dropdown();

        var btnOpenAlerts = $('a#openAlerts');
        var btnWinRefresh = $("#winRefresh");
        var btnWinMinimize = $("#winMinimize");
        var btnWinMaximize = $("#winMaximize");
        var btnWinClose = $("#winClose");

        btnOpenAlerts.click(function () {
            var winAlerts = nw.Window.open(window.location.host + '/overlay', {
                position: 'center',
                focus: true,
                width: 1280,
                height: 720
            });
            winAlerts.on('loaded', function () {
                log('SYS: Opened alerts window.');
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
        win.on('maximize', function () {
            isMaximized = true;
            console.log('SYS: Window maximized. isMaximized set to ' + isMaximized);
        });
        win.on('unmaximize', function () {
            isMaximized = false;
            console.log('SYS: Window unmaximized. isMaximized set to ' + isMaximized);
        }).on('restore', function () {
            isMaximized = false;
            console.log('SYS: Window unmaximized. isMaximized set to ' + isMaximized);
        });

        btnWinMaximize.click(function () {
            isMaximized ? win.restore() : win.maximize();
        });
        btnWinClose.click(function () {
            win.hide();
            // console.log('collapsing the singularity...');
            // win.close(true);
            // setTimeout(function () {
                win.close(true);
            // }, 5000);
        });
    } else {
        $('.menubar').hide();
        $('.full-container').css('marginTop', 0);
        $('.navbar > .container-fluid').attr('style', function(i,s) { return 'margin-top: 0 !important;' });
    }
});