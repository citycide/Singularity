$(document).ready( function() {
    var socket = io();

    var testFollowerUser = document.getElementById("testFollowerUser");
    var testHostUser = document.getElementById("testHostUser");
    var testSubUser = document.getElementById("testSubUser");
    var testDonationUser = document.getElementById("testDonationUser");

    var channel;
    socket.emit('getUserInfo');
    socket.on('setUserInfo', function (data) {
        channel = data.user;
        testFollowerUser.value = data.user;
        testHostUser.value = data.user;
        testSubUser.value = data.user;
        testDonationUser.value = data.user;
        document.getElementById('chat_embed').src = 'http://www.twitch.tv/' + data.user + '/chat';

        getStreamInfo();
    });

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
    $('[data-tooltip="tooltip"]').tooltip();

    var getStreamInfo = function () {
            $.getJSON(
            'https://api.twitch.tv/kraken/channels/' + channel,
            {
                "client_id": '41i6e4g7i1snv0lz0mbnpr75e1hyp9p'
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
                    console.log('DASH: Failed to get stream info, trying again...');
                    getStreamInfo();
                }, 5000);
            });
    };

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
