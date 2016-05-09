var socket = io();
var dev = false;

$(window).load(function() {
    setTimeout(function() {
        $('body').addClass('loaded');
    }, 200);
});

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

Vue.use(Keen);

var followerModel = JSON.parse(followerObj);
var nowPlaying = {
    title: currentSong
};
var state = {
    services: {
        tipeee: tipeeeEnabled
    }
};

var app = new Vue({
    el: 'body',
    components: {},
    methods: {
        say: function(msg) {
            alert(msg)
        },
        sendFollow: function() {
            // alert(this.follow.name + ' followed.');
            socket.emit('test:follower', this.follow.name);
        },
        sendHost: function() {
            socket.emit('test:host', {
                // alert(this.host.name + ' hosted for ' + this.host.viewers + ' viewers.');
                user: {
                    display_name: this.host.name
                },
                viewers: this.host.viewers
            });
        },
        sendSubscribe: function() {
            // alert(this.subscribe.name + ' has subbed for ' + this.subscribe.months + ' months.');
            if (this.subscribe.months === null || this.subscribe.months === undefined || this.subscribe.months === 0 || isNaN(this.subscribe.months)) {
                socket.emit('test:subscriber', this.subscribe.name);
            } else {
                socket.emit('test:resub', {
                    user: {
                        display_name: this.subscribe.name
                    },
                    months: this.subscribe.months
                });
            }
        },
        sendTip: function() {
            // alert(this.tip.name + ' tipped ' + this.tip.amount + ' and said ' + this.tip.message);
            var formattedAmount = '$' + this.tip.amount.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
            socket.emit('test:tip', {
                user: {
                    name: this.tip.name
                },
                amount: formattedAmount,
                message: this.tip.message
            });
        },
        sendSong: function(current) {
            var song = current ? this.currentSong : this.testSong;
            socket.emit('test:music', song);
        },
        tipeeeEnable: function() {
            // this.loaders.tipeee = true;
            state.services.tipeee = true;
            socket.emit('tipeee:activate');
        },
        tipeeeDisable: function() {
            // this.loaders.tipeee = true;
            state.services.tipeee = false;
            socket.emit('tipeee:deactivate');
        }
    },
    data: {
        follow: {
            name: channel
        },
        host: {
            name: channel,
            viewers: 10
        },
        subscribe: {
            name: channel,
            months: 10
        },
        tip: {
            name: channel,
            amount: 10,
            message: ''
        },
        show: {
            tipeeeDeactModal: false
        },
        loaders: {
            tipeee: false
        },
        state: state,
        testSong: 'Never Gonna Give You Up - Rick Astley',
        nowPlaying: nowPlaying,
        followTable: followerModel
    }
});

socket.on('alert:follow:event', function(data) {
    followerModel.followers.unshift({
        name: data.name,
        time: 'just now'
    });
});

socket.on('music:update', function(data) {
    nowPlaying.title = data;
});

socket.on('music:init', function(data) {
    nowPlaying.title = data;
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

    document.getElementById('profile-dropdown-logo').src = channelAvatar;

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

    $("#extTipeeeKey").click(function() {
        openLink('https://www.tipeeestream.com/dashboard/api-key');
        $('#step2-tab').trigger('click');
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

    document.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }, false);
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }, false);

    var btnOpenOverlay = $('a#btnOpenOverlay');
    if (isElectron) {
        btnOpenOverlay.click(function(e) {
            e.preventDefault();
            Emitter.fire('window:overlay:open');
        });
        /*
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
         */
    } else {
        btnOpenOverlay.click(function() {
            window.open('/overlay');
        });
    }
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
    if (isElectron) {
        const remote = require ('remote');
        remote.shell.openExternal(url);
    } else {
        window.open(url);
    }
}

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