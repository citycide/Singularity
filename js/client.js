$(document).ready( function() {
    var gui = require('nw.gui');

    var mainwin = gui.Window.get();
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

    var getStreamInfo = function () {
        var channel = 'citycide';
        $.getJSON(
            'https://api.twitch.tv/kraken/channels/' + channel,
            {
                "client_id": 'dnxwuiqq88xp87w7uurtyqbipprxeng'
            },
            function (data) {
                var game = data.game;
                var status = data.status;
                var gameSpan = $('#streamGame');
                var statusSpan = $('#streamTitle');
                if (game === null || game === undefined || game === "") {
                    gameSpan.text('<< No game set on Twitch. >>');
                } else {
                    gameSpan.text(game);
                }
                if (status === null || status === undefined || status === "") {
                    statusSpan.text('<< No status set on Twitch. >>');
                } else {
                    statusSpan.text(status);
                }
            }).fail(function () {
            setTimeout(function () {
                initFollowers(offset);
            }, pollInterval);
        });
    };
    getStreamInfo();
});
