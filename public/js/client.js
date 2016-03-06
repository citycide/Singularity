$(document).ready( function() {
    var gui = require('nw.gui');
    var win = gui.Window.get();
    var socket;
    var location = window.location;
    console.log(location);
    if(location === "http://localhost:2016/") {
        socket = io("http://localhost:2016");
    } else {
        socket = io.connect();
    }

    var log = function (msg, type) {
        if (type) {
            switch (type) {
                case 'dash':
                    console.log('DASH: ' + msg);
                    break;
                case 'test':
                    console.log('TEST: ' + msg);
                    break;
            }
        } else {
            console.log(msg);
        }
    };

    $('[data-toggle="tooltip"]').tooltip();

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
                var followers = parseInt(data.followers);
                var gameSpan = $('#streamGame');
                var statusSpan = $('#streamTitle');
                var followSpan = $('#badgeFollow');
                if (followers === null || followers === undefined || followers === "" || isNaN(followers)) {
                    followSpan.text('???');
                    log('Could not get follower count.', 'dash');
                } else {
                    followSpan.text(followers);
                    log('Retrieved follower count. (' + followers + ')', 'dash');
                }
                if (game === null || game === undefined || game === "") {
                    gameSpan.text('<< No game set on Twitch. >>');
                    log('No game is set on Twitch.', 'dash');
                } else {
                    gameSpan.text(game);
                    log('Game set to: ' + game);
                }
                if (status === null || status === undefined || status === "") {
                    statusSpan.text('<< No status set on Twitch. >>');
                    log('No status is set on Twitch.', 'dash');
                } else {
                    statusSpan.text(status);
                    log('Status set to: ' + status, 'dash');
                }
            }).fail(function () {
            setTimeout(function () {
                initFollowers(offset);
            }, pollInterval);
        });
    };
    getStreamInfo();

    var btnOpenAlerts = $('a#openAlerts');
    btnOpenAlerts.click(function() {
        var winAlerts = gui.Window.open('http://localhost:2016/overlays', {
            position: 'center',
            focus: true,
            width: 850,
            height: 275
        });
        winAlerts.on ('loaded', function(){
            log('SYS: Opened alerts window.');
            // var document = winAlerts.window.document;
        });
        return false;
    });

    $("#winRefresh").click(function () {
        win.reload();
    });
    $("#winMinimize").click(function () {
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

    $("#winMaximize").click(function () {
        isMaximized ? win.restore() : win.maximize();
    });
    $("#winClose").click(function () {
        win.hide();
        console.log('collapsing the singularity...');
        win.close(true);
        /*
        setTimeout(function () {
            win.close(true);
        }, 5000);
        */
    });

    $("#btnTestFollower").click(function() {
        var user = $("#testFollowerUser").val();
        socket.emit('newFollower', user);
        log('Sent follower test with name: ' + user + '.', 'test');
        return false;
    });

    $("#btnTestHost").click(function() {
        var user = $("#testHostUser").val();
        var viewers = parseInt($("#testHostViewers").val());
        socket.emit('newHoster', [user, viewers]);
        log('Sent host test with: ' + user + ' for ' + viewers + ' viewers.', 'test');
        return false;
    });

    $("#btnTestSub").click(function() {
        var user = $("#testSubUser").val();
        var months = parseInt($("#testSubMonths").val());
        if (months === null || months === undefined || months === 0 || isNaN(months)) {
            socket.emit('newSubscriber', user);
            log('Sent new subscriber test with name: ' + user + '.', 'test');
        } else {
            socket.emit('newResub', [user, months]);
            log('Sent resubscriber test with: ' + user + ' for ' + months + ' months.', 'test');
        }
        return false;
    });

    $("#btnTestDonation").click(function() {
        var user = $("#testDonationUser").val();
        var amount = parseInt($("#testDonationAmt").val());
        var message = $("#testDonationMsg").val();
        socket.emit('newDonation', [user, amount, message]);
        if (message === "" || message === null || message === undefined) {
            log('Sent new donation test from: ' + user + ' for ' + '$' + amount + '.', 'test');
        } else {
            log('Sent new donation test from: ' + user + ' for ' + '$' + amount + ', and message ' + message, 'test');
        }
        return false;
    });

    document.addEventListener('dragover', function(e){
        e.preventDefault();
        e.stopPropagation();
    }, false);
    document.addEventListener('drop', function(e){
        e.preventDefault();
        e.stopPropagation();
    }, false);
});
