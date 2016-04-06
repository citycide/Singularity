var socket = io();
var dev = false;

$(document).ready( function() {
    var testFollowerUser = document.getElementById("testFollowerUser");
    var testHostUser = document.getElementById("testHostUser");
    var testSubUser = document.getElementById("testSubUser");
    var testTipUser = document.getElementById("testTipUser");
    setTimeout(getStreamInfo, 1.5 * 1000);

    testFollowerUser.value = channel;
    testHostUser.value = channel;
    testSubUser.value = channel;
    testTipUser.value = channel;
    document.getElementById('chat_embed').src = 'http://www.twitch.tv/' + channel + '/chat';
    document.getElementById('profile-dropdown-logo').src = channelAvatar;

    /*
    socket.emit('getUserInfo');
    socket.on('setUserInfo', function (data) {
        channel = data.user;
        token = data.token;
        testFollowerUser.value = data.user;
        testHostUser.value = data.user;
        testSubUser.value = data.user;
        testTipUser.value = data.user;
        document.getElementById('chat_embed').src = 'http://www.twitch.tv/' + data.user + '/chat';
        document.getElementById('profile-dropdown-logo').src = data.logo;


    });
    */
    var gameSpan = $('#streamGame');
    var statusSpan = $('#streamTitle');
    var followDiv = $('#badgeFollow');
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
                    followDiv.text('???').addClass('font-huge');
                    log('Could not get follower count.', 'dash');
                } else {
                    followDiv.text(followers).addClass('font-huge');
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

    document.getElementById('currentSongTitle').innerText = currentSong;
    socket.on('newSong', function (data) {
        currentSong = data;
        document.getElementById('currentSongTitle').innerText = data;
    });

    $('[data-toggle="popover"]').popover({
        trigger: 'hover',
        container: 'body'
    });
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-tooltip="tooltip"]').tooltip();

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
        } else {
            $(this).css('transform', '');
            parent.attr('title', 'COLLAPSE')
                .tooltip('fixTitle')
                .data('bs.tooltip')
                .$tip.find('.tooltip-inner')
                .text('COLLAPSE');
        }
    });
    var streamEmbed = document.getElementById("streamEmbed");
    var btnCollapseStreamEmbed = $(".btnCollapseStreamEmbed");
    btnCollapseStreamEmbed.click(function () {
        var parent = $(this).parent();
        if ($(this).css('transform') == 'none') {
            $(this).css('transform', 'rotate(180deg)');
            parent.attr('title', 'EXPAND')
                .tooltip('fixTitle')
                .data('bs.tooltip')
                .$tip.find('.tooltip-inner')
                .text('EXPAND');
            streamEmbed.src = '//player.twitch.tv/?channel=' + channel;
        } else {
            $(this).css('transform', '');
            parent.attr('title', 'COLLAPSE')
                .tooltip('fixTitle')
                .data('bs.tooltip')
                .$tip.find('.tooltip-inner')
                .text('COLLAPSE');
            streamEmbed.src = '';
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
        var testHost = {
            user: {
                display_name: user
            },
            viewers: viewers
        };
        socket.emit('testHost', testHost);
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

    $("#btnTestTip").click(function () {
        var user = $("#testTipUser").val();
        var amount = parseInt($("#testTipAmt").val());
        var formattedAmount = '$' + amount.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
        var message = $("#testTipMsg").val();
        var testTip = {
            user: {
                name: user
            },
            amount: formattedAmount,
            message: message
        };
        socket.emit('testTip', testTip);
        if (message === "" || message === null || message === undefined) {
            log('Sent new tip test from: ' + user + ' for ' + '$' + amount + '.', 'test');
        } else {
            log('Sent new tip test from: ' + user + ' for ' + '$' + amount + ', and message ' + message, 'test');
        }
        return false;
    });

    $("#btnTestMusic").click(function () {
        var song = $("#testSongTitle").val();
        socket.emit('testMusic', song);
        log('Sent now playing with title: ' + song + '.', 'test');
        return false;
    });

    $("#btnSendCurrentSong").click(function () {
        var song = currentSong;
        socket.emit('testMusic', song);
        log('Sent now playing with title: ' + song + '.', 'test');
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

    nw.Window.get().on('new-win-policy', function(frame, url, policy) {
        if (url.indexOf('bttvSettings') !== -1) {
            policy.setNewWindowManifest({
                'frame': true,
                'title': 'BetterTTV Settings',
                'min_width': 810,
                'width': 810,
                'height': 548
            });
        } else {
            policy.setNewWindowManifest({
                'frame': true,
                'min_width': 600,
                'width': 800,
                'height': 600
            });
        }
    });

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

function updateTitle(title) {
    $.get(
        'https://api.twitch.tv/kraken/channels/' + channel,
        {
            "channel[status]": title,
            "_method": "put",
            "oauth_token": token.slice(6)
        }
    );
    log('Updated stream title to: ' + title, 'dash');
}

function updateGame(game) {
    $.get(
        'https://api.twitch.tv/kraken/channels/' + channel,
        {
            "channel[game]": game,
            "_method": "put",
            "oauth_token": token.slice(6)
        }
    );
    log('Updated current game to: ' + game, 'dash');
}

function log(msg, type) {
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
}

var tabsFn = (function() {
    function init() {
        setHeight();
    }

    function setHeight() {
        var $tabPane = $('.tab-pane'),
            tabsHeight = $('.nav-tabs').height();

        $tabPane.css({
            height: tabsHeight
        });
    }
    $(init);
})();