var gui = require('nw.gui');

var winAlerts;
$('a#openAlerts').click(function() {
    winAlerts = gui.Window.open('http://localhost:2882/', {
        position: 'center',
        width: 850,
        height: 275
    });

    winAlerts.on('closed', function() {
        winAlerts = null;
    });

    gui.Window.get().on('close', function() {
        this.hide();
        if (winAlerts != null) winAlerts.close(true);
        this.close(true);
    });
    return false;
});
