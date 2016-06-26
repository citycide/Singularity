/* global Vue, Keen, VueTables, state, moment, isElectron, fetch */

const socket = io();
const KRAKEN = 'https://api.twitch.tv/kraken';

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

$(() => {
    const STREAM_EMBED = document.getElementById('streamEmbed');
    const btnCollapsePanel = $('.btnCollapsePanel');
    btnCollapsePanel.click(function() {
        if ($(this).css('transform') === 'none') {
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

Vue.use(VueTables.client, {
    compileTemplates: true,
    pagination: {
        dropdown: false,
        chunk: 10
    },
    filterByColumn: true,
    texts: {
        filter: 'Search:',
        count: '{count} followers'
    },
    datepickerOptions: {
        showDropdowns: true
    },
    sortIcon: {
        base: 'fa',
        up: 'fa-chevron-up',
        down: 'fa-chevron-down'
    }
});

const app = new Vue({
    el: 'body',
    components: {},
    methods: {
        sendFollow: function(event, username) {
            // console.log(username ? username : this.follow.name + ' followed.');
            socket.emit('test:follower', username ? username : this.follow.name);
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
            if (!this.subscribe.months || isNaN(this.subscribe.months)) {
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
        botEnable: function() {
            socket.emit('settings:services:bot:activate');
        },
        botDisable: function() {
            socket.emit('settings:services:bot:deactivate');
        },
        botConfigure: function() {
            this.editing.bot = !this.editing.bot;
            if (this.editing.bot) return;
            if (!state.services.bot.name || !state.services.bot.auth) {
                return console.log('ERR in botConfigure:: Missing arguments.');
            }
            socket.emit('settings:services:bot:configure', {
                name: state.services.bot.name,
                auth: state.services.bot.auth
            });
        },
        tipeeeEnable: function() {
            state.services.tipeee = true;
            socket.emit('settings:services:tipeee:activate', this.tipeeeKeyInput);
        },
        tipeeeDisable: function() {
            state.services.tipeee = false;
            socket.emit('settings:services:tipeee:deactivate');
        },
        twitchAlertsEnable: function() {
            state.services.twitchAlerts = true;
            socket.emit('settings:services:twitchalerts:activate', this.twitchAlertsKeyInput);
        },
        twitchAlertsDisable: function() {
            state.services.twitchAlerts = false;
            socket.emit('settings:services:twitchalerts:deactivate');
        },
        streamTipEnable: function() {
            state.services.streamTip = true;
            socket.emit('settings:services:streamtip:activate', this.streamTipKeyInput);
        },
        streamTipDisable: function() {
            state.services.streamTip = false;
            socket.emit('settings:services:streamtip:deactivate');
        },
        alphabetFilter: function(letter) {
            this.selectedLetter = letter;
            this.$broadcast('vue-tables.filter::alphabet', letter);
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
            tipeeeDeactModal: false,
            twitchAlertsDeactModal: false,
            streamTipDeactModal: false
        },
        state,
        editing: {
            bot: false
        },
        tipeeeKeyInput: '',
        twitchAlertsKeyInput: '',
        streamTipKeyInput: '',
        testSong: 'Never Gonna Give You Up - Rick Astley',
        columns: ['username'],
        options: {
            // dateColumns: ['followDate'],
            headings: {
                username: 'USERNAME',
                followDate: 'DATE',
                followAge: 'AGE',
                notif: 'NOTIFICATIONS',
                resend: 'RESEND'
            },
            templates: {
                followDate: function(row) {
                    return moment(row.timestamp, 'x').format('ll');
                },
                followAge: function(row) {
                    return moment(row.timestamp, 'x').fromNow(' ');
                },
                notif: function(row) {
                    return (row.notifications === 'true')
                        ? `<i class="fa fa-check" style="color: green;"></i></a>`
                        : `<i class="fa fa-close" style="color: red;"></i></a>`;
                },
                resend: `<a href="" @click.stop.prevent="$parent.$parent.$parent.sendFollow(null, '{username}')">` +
                        `<i class="fa fa-paper-plane" style="color: #039BE5"></i></a>`
            },
            customFilters: [{
                name: 'alphabet',
                callback: function(row, query) {
                    return row.username[0] === query;
                }
            }],
            trackBy: 'twitchid',
            sortIcon: {
                base: 'fa',
                up: 'fa-chevron-up',
                down: 'fa-chevron-down'
            },
            orderBy: {
                column: 'username',
                ascending: true
            }
        },
        letters: [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
            'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
            'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
        ],
        selectedLetter: ''
    },
    watch: {
        'state.services.bot.status': function(val, old) {
            return val ? this.botEnable() : this.botDisable();
        }
    }
});

socket.on('alert:follow:event', data => {
    state.data.followers.unshift({
        twitchid: data.twitchid,
        username: data.username,
        timestamp: moment().valueOf(),
        age: 'just now',
        evtype: 'follower',
        notifications: data.notifications
    });
});

socket.on('music:update', data => {
    state.data.currentSong = data;
});

socket.on('music:init', data => {
    state.data.currentSong = data;
});

socket.on('data:res:recentFollowers', data => {
    if (!state.data.followers.length && Array.isArray(data) && data.length) {
        for (let item of data) {
            state.data.followers.push(item);
        }
    }
});

socket.on('data:res:followers', data => {
    if (!state.data.allFollowers.length && Array.isArray(data) && data.length) {
        for (let item of data) {
            state.data.allFollowers.push(item);
        }
    }
});

$(function() {
    openTabHash();
    window.addEventListener('hashchange', openTabHash, false);

    $('.btn-submit').on('click', function(e) {
        const formname = $(this).attr('name');
        const tabname = $(this).attr('href');

        if ($('#' + formname)[0].checkValidity()) {
            e.preventDefault();
            $(`ul.nav li a[href="${tabname}"]`).parent().removeClass('disabled');
            $(`ul.nav li a[href="${tabname}"]`).trigger('click');
        }
    });

    $('ul.nav li').on('click', e => {
        if ($(this).hasClass('disabled')) {
            e.preventDefault();
            return false;
        }
    });

    $('.btn-setupComplete').on('click', e => {
        e.preventDefault();
        window.location.href = window.location.origin;
        return false;
    });
});

$(() => {
    const GAME_SPAN = $('#streamGame');
    const STATUS_SPAN = $('#streamTitle');
    const FOLLOW_SPAN = $('#follower-panel-label');
    const VIEWS_SPAN = $('#views-panel-label');
    async function getStreamInfo() {
        const res = await request(`${KRAKEN}/channels/${state.user.channel}`);
        const json = await res.json();

        FOLLOW_SPAN.text(parseInt(json.followers) || '???');
        VIEWS_SPAN.text(parseInt(json.views) || '???');
        GAME_SPAN.text(json.game || '<< No game set on Twitch >>');
        STATUS_SPAN.text(json.status || '<< No status set on Twitch >>');
    }
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
            setEndOfContentEditable($(this).get(0));
            isEditingTitle = true;
            streamInfoInterval(false);
        }
    }).blur(function() {
        isEditingTitle = false;
        const newTitle = $(this).text();
        $(this).html(newTitle).removeAttr('contenteditable');
        if (currentTitle !== newTitle) {
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
            setEndOfContentEditable($(this).get(0));
            isEditingGame = true;
            streamInfoInterval(false);
        }
    }).blur(function() {
        isEditingGame = false;
        const newGame = $(this).text();
        $(this).html(newGame).removeAttr('contenteditable');
        if (currentGame !== newGame) {
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
        $('#tipeee-step2-tab').trigger('click');
        return false;
    });

    $('#extTwitchAlertsKey').click(() => {
        openLink('https://www.twitchalerts.com/dashboard/api-settings');
        $('#twitchalerts-step2-tab').trigger('click');
        return false;
    });

    $('#extStreamTipKey').click(() => {
        openLink('https://streamtip.com/account');
        $('#streamtip-step2-tab').trigger('click');
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

    document.addEventListener('dragover', e => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
    document.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
    }, false);

    const btnOpenOverlay = $('a#btnOpenOverlay');
    if (isElectron) {
        btnOpenOverlay.click(e => {
            e.preventDefault();
            Emitter.fire('window:overlay:open');
        });
    } else {
        btnOpenOverlay.click(() => {
            window.open('/overlay');
        });
    }
});

$(() => {
    return $('.side-menu .nav .dropdown').on('show.bs.collapse', () => {
        return $('.side-menu .nav .dropdown .collapse').collapse('hide');
    });
});

const setEndOfContentEditable = contentEditableElement => {
    let range, selection;
    if (document.createRange) {
        range = document.createRange();
        range.selectNodeContents(contentEditableElement);
        range.collapse(false);
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    } else if (document.selection) {
        range = document.body.createTextRange();
        range.moveToElementText(contentEditableElement);
        range.collapse(false);
        range.select();
    }
};

async function updateTitle(title) {
    await request(`${KRAKEN}/channels/${state.user.channel}`, {
        'channel[status]': title,
        'oauth_token': state.user.token.slice(6)
    }, {
        'Accept': 'application/vnd.twitchtv.v3+json'
    }, 'put');
}

async function updateGame(game) {
    await request(`${KRAKEN}/channels/${state.user.channel}`, {
        'channel[game]': game,
        'oauth_token': state.user.token.slice(6)
    }, {
        'Accept': 'application/vnd.twitchtv.v3+json'
    }, 'put');
}

async function request(url, params = {}, headers = {}, method = 'get') {
    let opts = '';
    if (Object.keys(params).length) {
        opts = '?';
        for (let [k, v] of Object.entries(params)) {
            if (!params.hasOwnProperty(k)) continue;
            opts += `${k}=${v}&`;
        }

        opts += `client_id=${state.clientID}`;
    } else {
        opts = `?client_id=${state.clientID}`;
    }

    let response;
    try {
        response = await fetch(url + opts, {
            method,
            headers
        });
        return response;
    } catch (e) {
        console.log(e);
    }
}

const openLink = url => {
    if (isElectron) {
        const remote = require('electron').remote;
        remote.shell.openExternal(url);
    } else {
        window.open(url);
    }
};

const openTabHash = () => {
    const url = document.location.toString();
    if (url.match('#')) {
        const hash = url.split('#')[1];
        $(`.tabnav li a[href=#${hash}]`).tab('show');
        if (!hash || hash !== 'dashboard') {
            // hideStreamPreview();
        }
    }

    $('.tabnav li a[data-toggle="tab"]').on('shown.bs.tab', e => {
        if (history.pushState) {
            history.pushState(null, null, e.target.hash);
        } else {
            window.location.hash = e.target.hash;
        }
    });
};
