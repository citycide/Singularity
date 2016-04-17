var socket = io();
var dev = false;

$(function() {
    $(".navbar-expand-toggle").click(function() {
        $(".app-container").toggleClass("expanded");
        return $(".navbar-expand-toggle").toggleClass("fa-rotate-90");
    });
    return $(".navbar-right-expand-toggle").click(function() {
        $(".navbar-right").toggleClass("expanded");
        return $(".navbar-right-expand-toggle").toggleClass("fa-rotate-90");
    });
});
/*
var data = {
    status : 'listen', // listen | ready | error
    error_msg : ''
};

var app = new Vue({
    el : '#app',
    data: data,

    created: function () {
        // this.getUserData();
    },
    filters : {},
    methods : {
        setReposData: function(reposData) {
            if (reposData.length > 0) {
                data.repos = reposData;

                window.setTimeout(function() {
                    document.querySelector('body').classList.remove('preload');
                    data.status = 'ready'; }, 1000);

            } else {
                data.status = 'error';
            }
        }
    }
});
*/
$(function() {
    var streamEmbed = document.getElementById("streamEmbed");
    var btnCollapsePanel = $(".btnCollapsePanel");
    btnCollapsePanel.click(function () {
        if ($(this).css('transform') == 'none') {
            $(this).css('transform', 'rotate(180deg)');
            if ($(this).hasClass('twitch-player')) {
                streamEmbed.src = '//player.twitch.tv/?channel=' + channel;
            }
        } else {
            $(this).css('transform', '');
            if ($(this).hasClass('twitch-player')) {
                setTimeout(function() {
                    streamEmbed.src = '';
                }, 1000);
            }
        }
    });
});

$(function() {
    var followerModel = JSON.parse(followerObj);

    var followerTable = new Vue({
        el: '#followerTable',
        data: followerModel,
        methods: {}
    });

    socket.on('addFollowEvent', function(data) {
        followerModel.followers.unshift(
            {
                name: data.name,
                time: 'just now'
            }
        );
    });
});

$(function() {
    openTabHash();
    window.addEventListener("hashchange", openTabHash, false);

    $('.btn-submit').on('click', function (e) {
        var formname = $(this).attr('name');
        var tabname = $(this).attr('href');

        if ($('#' + formname)[0].checkValidity()) {
            e.preventDefault();
            $('ul.nav li a[href="' + tabname + '"]').parent().removeClass('disabled');
            $('ul.nav li a[href="' + tabname + '"]').trigger('click');
        }
    });

    $('ul.nav li').on('click', function (e) {
        if ($(this).hasClass('disabled')) {
            e.preventDefault();
            return false;
        }
    });

    $('.btn-setupComplete').on('click', function (e) {
        e.preventDefault();
        window.location.href = window.location.origin;
        return false;
    });
});

function openTabHash() {
    var url = document.location.toString();
    if (url.match('#')) {
        var hash = url.split('#')[1];
        $('.tabnav li a[href=#'+hash+']').tab('show') ;
        if (!hash || hash !== dashboard) {
            // hideStreamPreview();
        }
    }

    $('.tabnav li a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        if(history.pushState) {
            history.pushState(null, null, e.target.hash);
        } else {
            window.location.hash = e.target.hash;
        }
    });
}

$(function() {
    var gameSpan = $('#streamGame');
    var statusSpan = $('#streamTitle');
    var followSpan = $('#follower-panel-label');
    var viewsSpan = $('#views-panel-label');
    function getStreamInfo() {
        $.getJSON(
            'https://api.twitch.tv/kraken/channels/' + channel,
            {
                "client_id": clientID
            },
            function (data) {
                // console.log(data);
                var game = data.game;
                var status = data.status;
                var followers = parseInt(data.followers);
                var views = parseInt(data.views);
                if (followers === null || followers === undefined || followers === "" || isNaN(followers)) {
                    followSpan.text('???');
                    console.log('Could not get follower count.');
                } else {
                    followSpan.text(followers);
                    // console.log('Retrieved follower count. (' + followers + ')');
                }
                if (views === null || views === undefined || views === "" || isNaN(views)) {
                    viewsSpan.text('???');
                    console.log('Could not get follower count.');
                } else {
                    viewsSpan.text(views);
                    // console.log('Retrieved views count. (' + views + ')');
                }
                if (game === null || game === undefined || game === "") {
                    gameSpan.text('<< No game set on Twitch. >>');
                    // log('No game is set on Twitch.', 'dash');
                } else {
                    gameSpan.text(game);
                    // log('Game set to: ' + game, 'dash');
                }
                if (status === null || status === undefined || status === "") {
                    statusSpan.text('<< No status set on Twitch. >>');
                    // log('No status is set on Twitch.', 'dash');
                } else {
                    statusSpan.text(status);
                    // log('Status set to: ' + status, 'dash');
                }
            });
    }
    getStreamInfo();
    setInterval(getStreamInfo, 60 * 1000);

    $('[data-toggle="popover"]').popover({
        trigger: 'hover',
        container: 'body'
    });
    $('[data-toggle="tooltip"]').tooltip();
    // $('[data-tooltip="tooltip"]').tooltip();

    document.getElementById('profile-dropdown-logo').src = channelAvatar;

    document.getElementById('currentSongTitle').textContent = currentSong;
    document.getElementById('currentSongTitlePanel').textContent = currentSong;
    socket.on('newSong', function (data) {
        currentSong = data;
        document.getElementById('currentSongTitle').textContent = data;
        document.getElementById('currentSongTitlePanel').textContent = data;
    });

    var isEditingTitle = false;
    var currentTitle;
    statusSpan.click(function () {
        if (isEditingTitle == false) {
            currentTitle = $(this).text();
            $(this).text(currentTitle)
                .attr("contenteditable", "true").focus();
            setEndOfContenteditable($(this).get(0));
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
            setEndOfContenteditable($(this).get(0));
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

    $("#btnTestFollower").click(function () {
        var user = $("#testFollowerUser").val();
        socket.emit('testFollower', user);
        // log('Sent follower test with name: ' + user + '.', 'test');
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
        // log('Sent host test with: ' + user + ' for ' + viewers + ' viewers.', 'test');
        return false;
    });

    $("#btnTestSub").click(function () {
        var user = $("#testSubUser").val();
        var months = parseInt($("#testSubMonths").val());
        if (months === null || months === undefined || months === 0 || isNaN(months)) {
            socket.emit('testSubscriber', user);
            // log('Sent new subscriber test with name: ' + user + '.', 'test');
        } else {
            socket.emit('testResub', [user, months]);
            // log('Sent resubscriber test with: ' + user + ' for ' + months + ' months.', 'test');
        }
        return false;
    });

    $("#btnTestTip").click(function() {
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
            // log('Sent new tip test from: ' + user + ' for ' + '$' + amount + '.', 'test');
        } else {
            // log('Sent new tip test from: ' + user + ' for ' + '$' + amount + ', and message ' + message, 'test');
        }
        return false;
    });

    $("#btnTestMusic").click(function() {
        var song = $("#testSongTitle").val();
        socket.emit('testMusic', song);
        // log('Sent now playing with title: ' + song + '.', 'test');
        return false;
    });

    $("#btnSendCurrentSong").click(function() {
        var song = currentSong;
        socket.emit('testMusic', song);
        // log('Sent now playing with title: ' + song + '.', 'test');
        return false;
    });

    $("#extTipeeeKey").click(function() {
        openLink('https://www.tipeeestream.com/dashboard/api-key');
        $('#step2-tab').trigger('click');
        return false;
    });
    $("#btnTipeeeKey").click(function() {
        var keyInput = $("#tipeeeKeyInput");
        if (!keyInput.val() || keyInput.val().length < 30) return;
        socket.emit('activateTipeee', keyInput.val());
        $('#step3-tab').trigger('click');
    });
    $("#btnTipeeeDeactivate").click(function() {
        socket.emit('disableTipeee');
        $('#tipeeeDeactModal').modal('hide');
    });

    $("#extTwitchChannel").click(function() {
        openLink('https://www.twitch.tv/' + channel);
        return false;
    });
    $("#extTwitchProfile").click(function() {
        openLink('https://www.twitch.tv/' + channel + '/profile');
        return false;
    });

    document.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }, false);
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }, false);

    var btnOpenOverlay = $('a#btnOpenOverlay');
    if (isNwjs) {
        btnOpenOverlay.click(function() {
            var winAlerts = nw.Window.open(window.location.host + '/overlay', {
                position: 'center',
                focus: true,
                width: 1280,
                height: 720
            });
            winAlerts.on('loaded', function(){
                log('SYS: Opened alerts window.');
            });
            return false;
        });

        nw.Window.get().on('new-win-policy', function (frame, url, policy) {
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
    } else {
        btnOpenOverlay.click(function() {
            window.open('/overlay');
        });
    }
});


$(function() {
  return $('select').select2();
});

$(function() {
  return $('.toggle-checkbox').bootstrapSwitch({
    size: "small"
  });
});

$(function() {
  return $('.match-height').matchHeight();
});

$(function() {
  return $('.datatable').DataTable({
    "dom": '<"top"fl<"clear">>rt<"bottom"ip<"clear">>'
  });
});

$(function() {
  return $(".side-menu .nav .dropdown").on('show.bs.collapse', function() {
    return $(".side-menu .nav .dropdown .collapse").collapse('hide');
  });
});

function setEndOfContenteditable(contentEditableElement)
{
    var range,selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection)//IE 8 and lower
    {
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
    }
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

function openLink(url) {
    if (isNwjs) {
        nw.Shell.openExternal(url);
    } else {
        window.open(url);
    }
}