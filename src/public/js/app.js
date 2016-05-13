const socket = io();

$(window).load(() => {
    setTimeout(() => {
        $('body').addClass('loaded');
    }, 200);
});

$(() => {
    $('.navbar-expand-toggle').click(() => {
        $('.app-container').toggleClass('expanded');
        return $('.navbar-expand-toggle').toggleClass('fa-rotate-90');
    });
    return $('.navbar-right-expand-toggle').click(() => {
        $('.navbar-right').toggleClass('expanded');
        return $('.navbar-right-expand-toggle').toggleClass('fa-rotate-90');
    });
});

$(function() {
    const STREAM_EMBED = document.getElementById('streamEmbed');
    const btnCollapsePanel = $('.btnCollapsePanel');
    btnCollapsePanel.click(function() {
        if ($(this).css('transform') == 'none') {
            $(this).css('transform', 'rotate(180deg)');
            if ($(this).hasClass('twitch-player')) {
                STREAM_EMBED.src = `//player.twitch.tv/?channel=${state.user.channel}`;
            }
        } else {
            $(this).css('transform', '');
            if ($(this).hasClass('twitch-player')) {
                setTimeout(() => {
                    STREAM_EMBED.src = '';
                }, 1000);
            }
        }
    });
});

Vue.use(Keen);

const app = new Vue({
    el: 'body',
    components: {},
    methods: {
        sendFollow: function() {
            // console.log(this.follow.name + ' followed.');
            socket.emit('test:follower', this.follow.name);
        },
        sendHost: function() {
            socket.emit('test:host', {
                // console.log(this.host.name + ' hosted for ' + this.host.viewers + ' viewers.');
                user: {
                    display_name: this.host.name
                },
                viewers: this.host.viewers
            });
        },
        sendSubscribe: function() {
            // console.log(this.subscribe.name + ' has subbed for ' + this.subscribe.months + ' months.');
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
            // console.log(this.tip.name + ' tipped ' + this.tip.amount + ' and said ' + this.tip.message);
            const formattedAmount = '$' + this.tip.amount.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
            socket.emit('test:tip', {
                user: {
                    name: this.tip.name
                },
                amount: formattedAmount,
                message: this.tip.message
            });
        },
        sendSong: function(current) {
            const song = current ? this.state.data.currentSong : this.testSong;
            socket.emit('test:music', song);
        },
        tipeeeEnable: function() {
            state.services.tipeee = true;
            socket.emit('tipeee:activate');
        },
        tipeeeDisable: function() {
            state.services.tipeee = false;
            socket.emit('tipeee:deactivate');
        }
    },
    data: {
        follow: {
            name: state.user.channel
        },
        host: {
            name: state.user.channel,
            viewers: 10
        },
        subscribe: {
            name: state.user.channel,
            months: 10
        },
        tip: {
            name: state.user.channel,
            amount: 10,
            message: ''
        },
        show: {
            tipeeeDeactModal: false
        },
        state,
        testSong: 'Never Gonna Give You Up - Rick Astley'
    }
});

socket.on('alert:follow:event', (data) => {
    state.data.followers.unshift({
        name: data.name,
        time: 'just now'
    });
});

socket.on('music:update', (data) => {
    state.data.currentSong = data;
});

socket.on('music:init', (data) => {
    state.data.currentSong = data;
});

$(function() {
    openTabHash();
    window.addEventListener('hashchange', openTabHash, false);

    $('.btn-submit').on('click', function(e) {
        var formname = $(this).attr('name');
        var tabname = $(this).attr('href');

        if ($('#' + formname)[0].checkValidity()) {
            e.preventDefault();
            $('ul.nav li a[href="' + tabname + '"]').parent().removeClass('disabled');
            $('ul.nav li a[href="' + tabname + '"]').trigger('click');
        }
    });

    $('ul.nav li').on('click', function(e) {
        if ($(this).hasClass('disabled')) {
            e.preventDefault();
            return false;
        }
    });

    $('.btn-setupComplete').on('click', function(e) {
        e.preventDefault();
        window.location.href = window.location.origin;
        return false;
    });
});

$(function() {
    const GAME_SPAN = $('#streamGame');
    const STATUS_SPAN = $('#streamTitle');
    const FOLLOW_SPAN = $('#follower-panel-label');
    const VIEWS_SPAN = $('#views-panel-label');
    const getStreamInfo = () => {
        $.getJSON(
            `https://api.twitch.tv/kraken/channels/${state.user.channel}`,
            {
                "client_id": state.clientID
            },
            (data) => {
                var game = data.game;
                var status = data.status;
                var followers = parseInt(data.followers);
                var views = parseInt(data.views);
                if (followers === null || followers === undefined || followers === '' || isNaN(followers)) {
                    FOLLOW_SPAN.text('???');
                    console.log('Could not get follower count.');
                } else {
                    FOLLOW_SPAN.text(followers);
                }
                if (views === null || views === undefined || views === '' || isNaN(views)) {
                    VIEWS_SPAN.text('???');
                    console.log('Could not get follower count.');
                } else {
                    VIEWS_SPAN.text(views);
                }
                if (game === null || game === undefined || game === '') {
                    GAME_SPAN.text('<< No game set on Twitch. >>');
                } else {
                    GAME_SPAN.text(game);
                }
                if (status === null || status === undefined || status === '') {
                    STATUS_SPAN.text('<< No status set on Twitch. >>');
                } else {
                    STATUS_SPAN.text(status);
                }
            });
    };
    getStreamInfo();
    let intervalID = null;
    const streamInfoInterval = (flag, time) => {
        if (flag) {
            intervalID = setInterval(getStreamInfo, time);
        } else {
            clearInterval(intervalID);
        }
    };
    streamInfoInterval(true, 60 * 1000);

    $('[data-toggle="popover"]').popover({
        trigger: 'hover',
        container: 'body'
    });
    $('[data-toggle="tooltip"]').tooltip();

    document.getElementById('profile-dropdown-logo').src = state.user.channelAvatar;

    let isEditingTitle = false;
    let currentTitle;
    STATUS_SPAN.click(function() {
        if (isEditingTitle === false) {
            currentTitle = $(this).text();
            $(this).text(currentTitle)
                .attr('contenteditable', 'true').focus();
            setEndOfContenteditable($(this).get(0));
            isEditingTitle = true;
            streamInfoInterval(false);
        }
    }).blur(function() {
        isEditingTitle = false;
        var newTitle = $(this).text();
        $(this).html(newTitle).removeAttr('contenteditable');
        if (currentTitle != newTitle) {
            updateTitle(newTitle);
        }
        streamInfoInterval(true, 60 * 1000);
    }).keydown(function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            $(this).removeAttr('contenteditable');
            return false;
        }
    });

    let isEditingGame = false;
    let currentGame;
    GAME_SPAN.click(function() {
        if (isEditingGame === false) {
            currentGame = $(this).text();
            $(this).text(currentGame)
                .attr('contenteditable', 'true').focus();
            setEndOfContenteditable($(this).get(0));
            isEditingGame = true;
            streamInfoInterval(false);
        }
    }).blur(function() {
        isEditingGame = false;
        var newGame = $(this).text();
        $(this).html(newGame).removeAttr('contenteditable');
        if (currentGame != newGame) {
            updateGame(newGame);
        }
        streamInfoInterval(true, 60 * 1000);
    }).keydown(function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            $(this).removeAttr('contenteditable');
            return false;
        }
    });

    $('#extTipeeeKey').click(() => {
        openLink('https://www.tipeeestream.com/dashboard/api-key');
        $('#step2-tab').trigger('click');
        return false;
    });

    $('#extTwitchChannel').click(() => {
        openLink(`https://www.twitch.tv/${state.user.channel}`);
        return false;
    });
    $('#extTwitchProfile').click(() => {
        openLink(`https://www.twitch.tv/${state.user.channel}/profile`);
        return false;
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);

    const btnOpenOverlay = $('a#btnOpenOverlay');
    if (isElectron) {
        btnOpenOverlay.click((e) => {
            e.preventDefault();
            Emitter.fire('window:overlay:open');
        });
    } else {
        btnOpenOverlay.click(() => {
            window.open('/overlay');
        });
    }
});

$(function() {
    return $('.side-menu .nav .dropdown').on('show.bs.collapse', () => {
        return $('.side-menu .nav .dropdown .collapse').collapse('hide');
    });
});

const setEndOfContenteditable = (contentEditableElement) => {
    let range, selection;
    if (document.createRange) {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    } else if (document.selection) {
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection)
    }
}

const updateTitle = (title) => {
    $.get(
        `https://api.twitch.tv/kraken/channels/${state.user.channel}`,
        {
            "channel[status]": title,
            "_method": "put",
            "oauth_token": state.user.token.slice(6)
        }
    );
};

const updateGame = (game) => {
    $.get(
        `https://api.twitch.tv/kraken/channels/${state.user.channel}`,
        {
            "channel[game]": game,
            "_method": "put",
            "oauth_token": state.user.token.slice(6)
        }
    );
};

const openLink = (url) => {
    if (isElectron) {
        const remote = require ('remote');
        remote.shell.openExternal(url);
    } else {
        window.open(url);
    }
};

const openTabHash = () => {
    var url = document.location.toString();
    if (url.match('#')) {
        var hash = url.split('#')[1];
        $('.tabnav li a[href=#'+hash+']').tab('show') ;
        if (!hash || hash !== 'dashboard') {
            // hideStreamPreview();
        }
    }

    $('.tabnav li a[data-toggle="tab"]').on('shown.bs.tab', (e) => {
        if(history.pushState) {
            history.pushState(null, null, e.target.hash);
        } else {
            window.location.hash = e.target.hash;
        }
    });
};