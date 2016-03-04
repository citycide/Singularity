var mainwin,
    gui;

$(document).ready( function() {
    gui = require('nw.gui');

    mainwin = gui.Window.get();
    mainwin.on("close", function() {
        this.hide();
        console.log("collapsing the singularity...");
        this.close(true);
    });

    $('[data-toggle="tooltip"]').tooltip();

    var btnOpenAlerts = $('a#openAlerts');
    btnOpenAlerts.click(function () {
        var winAlerts = gui.Window.open('http://localhost:2882/', {
            position: 'center',
            width: 850,
            height: 275
        });

        winAlerts.on('closed', function () {
            winAlerts = null;
        });

        gui.Window.get().on('close', function () {
            this.hide();
            if (winAlerts != null) winAlerts.close(true);
            this.close(true);
        });
        return false;
    });
});
