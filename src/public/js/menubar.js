$(document).ready( function() {
    if (isElectron) {
        $('.dropdown-toggle').dropdown();

        var btnOpenAlerts = $('a#openAlerts');

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
    } else {
        $('body').addClass('no-electron');
        /*
        $('.window-border').css('border', 0);
        $('.title-bar').hide();
        $('.full-container').css('marginTop', 0);
        $('.navbar > .container-fluid').attr('style', function(i,s) { return 'margin-top: 0 !important;' });
        */
    }
});