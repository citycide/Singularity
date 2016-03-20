$(document).ready( function() {
    var socket = io();

    var testFollowerUser = document.getElementById("testFollowerUser");
    var testHostUser = document.getElementById("testHostUser");
    var testSubUser = document.getElementById("testSubUser");
    var testDonationUser = document.getElementById("testDonationUser");

    var channel, token;
    socket.emit('getUserInfo');
    socket.on('setUserInfo', function (data) {
        channel = data.user;
        token = data.token;
        testFollowerUser.value = data.user;
        testHostUser.value = data.user;
        testSubUser.value = data.user;
        testDonationUser.value = data.user;
        document.getElementById('chat_embed').src = 'http://www.twitch.tv/' + data.user + '/chat';
        document.getElementById('profile-dropdown-logo').src = data.logo;

        setTimeout(getStreamInfo, 1.5 * 1000);
    });

    var dev = false;
    var log = function (msg, type) {
        if (dev) {
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
        }
    };

    $('[data-toggle="tooltip"]').tooltip();
    $('[data-tooltip="tooltip"]').tooltip();
    var gameSpan = $('#streamGame');
    var statusSpan = $('#streamTitle');
    var followSpan = $('#badgeFollow');

    function getStreamInfo() {
        $.getJSON(
            'https://api.twitch.tv/kraken/channels/' + channel,
            {
                "client_id": clientID
            },
            function (data) {
                var game = data.game;
                var status = data.status;
                var followers = parseInt(data.followers);
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
                    log('Game set to: ' + game, 'dash');
                }
                if (status === null || status === undefined || status === "") {
                    statusSpan.text('<< No status set on Twitch. >>');
                    log('No status is set on Twitch.', 'dash');
                } else {
                    statusSpan.text(status);
                    log('Status set to: ' + status, 'dash');
                }
            });
    }

    setInterval(getStreamInfo, 60 * 1000);

    var updateTitle = function (title) {
        $.get(
            'https://api.twitch.tv/kraken/channels/' + channel,
            {
                "channel[status]": title,
                "_method": "put",
                "oauth_token": token.slice(6)
            }
        );
        log('Updated stream title to: ' + title, 'dash');
    };

    var updateGame = function (game) {
        $.get(
            'https://api.twitch.tv/kraken/channels/' + channel,
            {
                "channel[game]": game,
                "_method": "put",
                "oauth_token": token.slice(6)
            }
        );
        log('Updated current game to: ' + game, 'dash');
    };

    var isEditingTitle = false;
    var currentTitle;
    statusSpan.click(function () {
        if (isEditingTitle == false) {
            currentTitle = $(this).text();
            $(this).text(currentTitle)
                .attr("contenteditable", "true").focus();
            isEditingTitle = true;
        }
    }).blur(function () {
        isEditingTitle = false;
        var newTitle = $(this).text();
        $(this).html(newTitle).removeAttr("contenteditable");
        if (currentTitle != newTitle) {
            updateTitle(newTitle);
        }
    }).keydown(function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            $(this).removeAttr("contenteditable");
            return false;
        }
    });

    var isEditingGame = false;
    var currentGame;
    gameSpan.click(function () {
        if (isEditingGame == false) {
            currentGame = $(this).text();
            $(this).text(currentGame)
                .attr("contenteditable", "true").focus();
            isEditingGame = true;
        }
    }).blur(function () {
        isEditingGame = false;
        var newGame = $(this).text();
        $(this).html(newGame).removeAttr("contenteditable");
        if (currentGame != newGame) {
            updateGame(newGame);
        }
    }).keydown(function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            $(this).removeAttr("contenteditable");
            return false;
        }
    });

    $('div[contenteditable]').keydown(function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            $(this).removeAttr("contenteditable");
            return false;
        }
    });

    var btnCollapsePanel = $(".btnCollapsePanel");
    btnCollapsePanel.click(function () {
        var parent = $(this).parent();
        if ($(this).css('transform') == 'none') {
            $(this).css('transform', 'rotate(180deg)');
            parent.attr('title', 'EXPAND')
                .tooltip('fixTitle')
                .data('bs.tooltip')
                .$tip.find('.tooltip-inner')
                .text('EXPAND');
            parent.find("iframe", function () {
                console.log('found');
            });
        } else {
            $(this).css('transform', '');
            parent.attr('title', 'COLLAPSE')
                .tooltip('fixTitle')
                .data('bs.tooltip')
                .$tip.find('.tooltip-inner')
                .text('COLLAPSE');
            parent.find("iframe", function () {
                this.show();
            });
        }
    });

    $("#btnTestFollower").click(function () {
        var user = $("#testFollowerUser").val();
        socket.emit('testFollower', user);
        log('Sent follower test with name: ' + user + '.', 'test');
        return false;
    });

    $("#btnTestHost").click(function () {
        var user = $("#testHostUser").val();
        var viewers = parseInt($("#testHostViewers").val());
        socket.emit('testHoster', [user, viewers]);
        log('Sent host test with: ' + user + ' for ' + viewers + ' viewers.', 'test');
        return false;
    });

    $("#btnTestSub").click(function () {
        var user = $("#testSubUser").val();
        var months = parseInt($("#testSubMonths").val());
        if (months === null || months === undefined || months === 0 || isNaN(months)) {
            socket.emit('testSubscriber', user);
            log('Sent new subscriber test with name: ' + user + '.', 'test');
        } else {
            socket.emit('testResub', [user, months]);
            log('Sent resubscriber test with: ' + user + ' for ' + months + ' months.', 'test');
        }
        return false;
    });

    $("#btnTestDonation").click(function () {
        var user = $("#testDonationUser").val();
        var amount = parseInt($("#testDonationAmt").val());
        var message = $("#testDonationMsg").val();
        socket.emit('testDonation', [user, amount, message]);
        if (message === "" || message === null || message === undefined) {
            log('Sent new donation test from: ' + user + ' for ' + '$' + amount + '.', 'test');
        } else {
            log('Sent new donation test from: ' + user + ' for ' + '$' + amount + ', and message ' + message, 'test');
        }
        return false;
    });

    $("#extTwitchChannel").click(function() {
        openLink('https://www.twitch.tv/' + channel);
        return false;
    });
    $("#extTwitchProfile").click(function() {
        openLink('https://www.twitch.tv/' + channel + '/profile');
        return false;
    });

    document.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
    }, false);
    document.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
    }, false);

    var win = nw.Window.get();
    var chatFrame = document.getElementById('chat_embed');
    var bttv =
        "var betterttv_init = function (){" +
        "var script = document.createElement('script');" +
        "script.type = 'text/javascript';" +
        "script.src = '//cdn.betterttv.net/betterttv.js?';" +
        "var head = document.getElementsByTagName('head')[0];" +
        "if(head) head.appendChild(script); };" +
        "betterttv_init();";
    chatFrame.onload = function () {
        win.eval(chatFrame, bttv);
    };
});

function openLink(url) {
    nw.Shell.openExternal(url);
}