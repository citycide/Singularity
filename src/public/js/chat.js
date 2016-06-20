/* global CHANNEL:false, CLIENT_ID:false, irc:false, isElectron:false, moment:false */

/**
 * Credit to MEMECHAT
 * https://github.com/TyroneSama/memechat
 * & also NIGHTDEV
 */

const SETTINGS = {
    background: 'dark',
    bots: ['nightbot', 'moobot', 'thecitybot'],
    maxLines: 200
};

const chatBox = document.getElementById('chat_box');
const displayNames = {};
const emoteMap = new Map();
let totalLines = 0;

const OPTIONS = {
    options: {
        debug: false
    },
    connection: {
        reconnect: true,
        cluster: 'aws'
    },
    identity: {
        username: CHANNEL.name,
        password: CHANNEL.token
    },
    channels: [CHANNEL.name]
};

const client = new irc.client(OPTIONS);
client.connect().then(() => {
    getEmotesBTTV();
}).catch((err) => {
    console.log(err);
});

/*
function injectTests() {
    for (let num = 0; num < 20; num++) {
        let offset = (num < 10) ? '74-78' : '75-79';
        addMessage({
            username: 'TyCurious',
            color: '#13a89e',
            emotes: {
                25: [offset]
            }
        }, `testing with a message, this should be a couple lines long and is test #${num} Kappa`, CHANNEL.name, false);
    }
}
setTimeout(injectTests, 5 * 1000);
*/

function parseTwitchEmotes(message, emotes, self) {
    if (!self) {
        // convert the message string to an array
        let splitText = message.split('');

        // emotes = { '25': [ '0-4' ] }
        for (let emote in emotes) {
            if (!emotes.hasOwnProperty(emote)) continue;
            const set = emotes[emote];
            for (let location of set) {
                // location is the string value in each emote's array, ie. '0-4'
                // each digit is an offset from total message start
                if (typeof location === 'string') {
                    // split the location into its two values
                    let pair = location.split('-');
                    const emoteStart = parseInt(pair[0]);
                    const emoteEnd = parseInt(pair[1]);
                    if (typeof emoteStart !== 'number' || typeof emoteEnd !== 'number') {
                        console.log('Emote location invalid:: ', typeof emoteStart, typeof emoteEnd);
                        continue;
                    }

                    // create an empty array between the two values
                    const length = (emoteEnd - emoteStart) + 1;
                    if (length < 1) continue;
                    const empty = new Array(length).fill('');

                    // add the empty array between the two values
                    splitText = splitText
                    .slice(0, emoteStart)
                    .concat(empty)
                    .concat(splitText.slice(emoteEnd + 1, splitText.length));

                    // replace each instance of an emote with an HTML image node
                    const img = `<img class="emoticon" src="//static-cdn.jtvnw.net/emoticons/v1/${emote}/1.0">`;
                    splitText.splice(emoteStart, 1, img);
                }
            }
        }

        // convert the message back to a string
        return splitText.join('');
    } else {
        let output = '';

        const text = message.split(' ');
        for (let word of text) {
            if (emoteMap.has(word)) {
                console.log(emoteMap.get(word));
                output += `<img class="emoticon" src="${emoteMap.get(word)}">`;
            } else {
                output += word + ' ';
            }
        }

        return output;
    }
}

function parseBTTVEmotes(message) {
    // emoteMap is a key-value object containing:
    // - BTTV emotes
    // - any emotes pulled using getEmotes()
    for (let [k, v] of emoteMap) {
        const img = `<img class="emoticon" src=${v}>`;
        message = message.replace(k, img);
    }
    return message;
}

function getMessageType(username, message) {
    if (SETTINGS.bots.includes(username)) return 'bot';
    if (message.charAt(0) === '!') return 'command';
    return 'standard';
}

function getDisplayName(user) {
    if (displayNames[user] === undefined) {
        apiGet(`/users/${user}`, (err, res, body) => {
            if (err) return console.log(err);

            displayNames[user] = body.display_name;
            $(`div[data-user=${user}] span.username`).text(displayNames[user]);
        });
    }
    if (displayNames[user] === undefined) return user;
    return displayNames[user];
}

function parseUserBadges(user) {
    const $newLine = $('<span></span>');
    if (typeof user['user-type'] === 'string' && user['user-type'] !== 'normal') {
        const $badge = $('<span></span>');
        $badge.addClass(user['user-type']);
        $badge.addClass('tag');
        $badge.html('&nbsp;');
        $newLine.append($badge);
    }
    if (user.username === CHANNEL.name) {
        const $badge = $('<span></span>');
        $badge.addClass('broadcaster');
        $badge.addClass('tag');
        $badge.html('&nbsp;');
        $newLine.append($badge);
    }
    ["turbo", "subscriber"].forEach((type) => {
        if (user[type] === true) {
            const $badge = $('<span></span>');
            $badge.addClass(type);
            $badge.addClass('tag');
            $badge.html('&nbsp;');
            $newLine.append($badge);
        }
    });
    return $newLine[0].outerHTML;
}

function trimChat() {
    totalLines += 1;
    if (totalLines > SETTINGS.maxLines) {
        $('.chat_line').first().remove();
    }
}

function sendMessage(message) {
    if (message && message.trim() !== '') {
        client.say(CHANNEL.name, message).then((data) => {
        }).catch((err) => {
            console.log(err);
        });
    }
}

function addMessage(user, message, channel, action, self) {
    let username = user.username;
    username = getDisplayName(username);

    const msgType = getMessageType(username, message);
    const color = shiftColor(user.color, SETTINGS.background, username);
    const badges = parseUserBadges(user);

    const parsedMessage = parseBTTVEmotes(parseTwitchEmotes(message, user.emotes, self));

    const classes = action ? 'chat_line action' : 'chat_line';
    const msgStyle = action ? ` style='color: ${color};'` : '';
    const colon = action ? ' ' : `<span class='colon'>: </span>`;
    const ts = moment().format('h:mm');

    chatBox.innerHTML += `<div class="${classes}" data-type="${msgType}" data-user="${username}" ` +
                         `data-channel="${channel}"><span class="time_stamp">${ts}</span>${badges}` +
                         `<span class="username" style="color: ${color};">${username}</span>${colon}` +
                         `<span class="message"${msgStyle}>${parsedMessage}</span></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    trimChat();
}

function addWhisper(user, message) {
    const username = getDisplayName(user.username);
    const color = shiftColor(user.color, SETTINGS.background, username);
    const parsedMessage = parseBTTVEmotes(parseTwitchEmotes(message, user.emotes));
    const classes = 'chat_line whisper-from';
    const arrow = `<span class='arrow'><i class="fa fa-long-arrow-right"></i></span>`;
    const colon = `<span class='colon'>: </span>`;
    const ts = moment().format('h:mm');

    chatBox.innerHTML += `<div class="${classes}" data-type="whisper" data-user="${username}">` +
                         `<span class="time_stamp">${ts}</span><span class="username" style="color: ${color};">` +
                         `${username}</span> ${arrow} ${CHANNEL.name}${colon}<span class="message">` +
                         `${parsedMessage}</span></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    trimChat();
}

function addSystemMessage(message) {
    chatBox.innerHTML += `<div class="chat_line" data-type="system"><span class="message">${message}</span></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    trimChat();
}

function getEmotes(sets = '0') {
    apiGet(`/chat/emoticon_images?emotesets=${sets}`, (err, res, body = {}) => {
        if (err) return console.log(err);

        let num = 0;
        const sets = body.emoticon_sets;
        for (let set in sets) {
            if (!sets.hasOwnProperty(set)) continue;

            for (let emote of sets[set]) {
                emoteMap.set(emote.code, `//static-cdn.jtvnw.net/emoticons/v1/${emote.id}/1.0`);
                num += 1;
            }
        }

        console.log(`Loaded ${num} Twitch emotes.`);
    });
}

function getEmotesBTTV() {
    $.getJSON(`//api.betterttv.net/2/channels/${CHANNEL.name}`, (res) => {
        if (res.emotes) {
            for (let i in res.emotes) {
                if (!res.emotes.hasOwnProperty(i)) continue;
                emoteMap.set(res.emotes[i].regex, `//cdn.betterttv.net/emote/${res.emotes[i].id}/1x`);
            }
            console.log(`Loaded ${res.emotes.length} BTTV channel emotes.`);
        }
    });
    $.getJSON('//api.betterttv.net/emotes', (res) => {
        if (res.emotes) {
            for (let i in res.emotes) {
                if (!res.emotes.hasOwnProperty(i)) continue;
                emoteMap.set(res.emotes[i].regex, `${res.emotes[i].url}`);
            }
            console.log(`Loaded ${res.emotes.length} BTTV emotes.`);
        }
    });
}

const $btnChat = $('.btn-chat');
const $chatInput = $('.chat-input');
$btnChat.click((e) => {
    e.preventDefault();
    sendMessage($chatInput.val());
    $chatInput.val('');
});
$chatInput.keydown((e) => {
    if (e.which === 13) {
        e.preventDefault();
        if ($chatInput.val() !== '') {
            sendMessage($chatInput.val());
            $chatInput.val('');
        }
    }
    if (e.which === 9) {
        e.preventDefault();
    }
});

$('#btn-pop-out').click(() => {
    if (isElectron) {
        if (window.frameElement === null) {
            console.log('Not running in iframe.');
            return false;
        } else {
            console.log('Running in iframe, popping out.');
            parent.$('.btnCollapsePanel[href*="#collapseChat"').trigger('click');
            const nw = parent.nw;
            nw.Window.open(window.location.origin + '/chat', {
                position: 'center',
                focus: true,
                width: 440,
                height: 850
            }, (win) => {
                win.on('close', () => {
                    win.hide();
                    console.log('Popout window closed.');
                    parent.$('.btnCollapsePanel[href*="#collapseChat"').trigger('click');
                    win.close(true);
                });
            });
            return false;
        }
    } else {
        $('#btn-pop-out').click(() => {
            window.open(window.location.origin + '/chat');
        });
    }
});

/**
 * Chat event listeners
 */

client.on('chat', (channel, user, message, self) => {
    addMessage(user, message, channel, false, self);
});

client.on('action', (channel, user, message, self) => {
    addMessage(user, message, channel, true);
});

client.on('connecting', (address, port) => {
    addSystemMessage('connecting...');
});

client.on('connected', (address, port) => {
    console.log(`Connected to Twitch chat at ${address}:${port}`);
    addSystemMessage(`connected to ${CHANNEL.name}'s chat.`);
});

client.on('disconnected', (reason) => {
    addSystemMessage('disconnected');
});

client.on('logon', () => {
    // addSystemMessage('Logging in...');
});

client.on('reconnect', () => {
    addSystemMessage('reconnecting...');
});

client.on('timeout', (channel, username) => {
    $(`div[data-channel=${channel}][data-user=${username}]`).remove();
});

client.on('whisper', (user, message) => {
    addWhisper(user, message);
});

client.on('emotesets', (sets) => getEmotes(sets));

function apiGet(url, fn) {
    client.api({
        url,
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.twitchtv.v3+json',
            'Authorization': `OAuth ${CHANNEL.token.slice(6)}`,
            'Client-ID': CLIENT_ID
        }
    }, (err, res, body) => {
        fn(err, res, body);
    });
}

/**
 * Helper functions
 */

// From Cristian Sanchez - http://stackoverflow.com/a/3426956
function hashColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();

    return '00000'.substring(0, 6 - c.length) + c;
}

// From KapChat - https://www.nightdev.com/kapchat/
function calculateColorBackground(color) {
    color = String(color).replace(/[^0-9a-f]/gi, '');
    if (color.length < 6) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }

    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'dark' : 'light';
}

// From KapChat - https://www.nightdev.com/kapchat/
function calculateColorReplacement(color, background) {
    const inputColor = color;
    let rgb = '#';
    let brightness;

    color = String(color).replace(/[^0-9a-f]/gi, '');
    if (color.length < 6) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }

    brightness = (background === 'light') ? '0.2' : '-0.5';

    for (let i = 0; i < 3; i++) {
        let c = parseInt(color.substr(i * 2, 2), 16);
        if (c < 10) c = 10;
        c = Math.round(Math.min(Math.max(0, c + (c * brightness)), 255)).toString(16);
        rgb += ('00' + c).substr(c.length);
    }

    if (inputColor === rgb) {
        if (background === 'light') {
            return '#ffffff';
        } else {
            return '#000000';
        }
    } else {
        return rgb;
    }
}

function shiftColor(color, background, user) {
    if (color == null) {
        color = hashColor(user);
    }
    while (calculateColorBackground(color) !== background) {
        color = calculateColorReplacement(color, calculateColorBackground(color));
    }
    return color;
}
