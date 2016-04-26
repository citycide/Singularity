/**
 * Credit to MEMECHAT
 * https://github.com/TyroneSama/memechat
 */

var background = 'dark'; // light || dark
var bots = ['nightbot', 'moobot', 'thecitybot'];
var maxLines = 200;

var chatBox = document.getElementById('chat_box');
var displayNames = {};
var totalLines = 0;
var BTTVEmotes = [];
var emoteMap = new Map();

var OPTIONS = {
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

var client = new irc.client(OPTIONS);
client.connect().then(function(data) {
    getEmotes();
    getEmotesBTTV();
}).catch(function(err) {
    console.log(err);
});

var whispers = new irc.client({
    options: OPTIONS.options,
    connection: {
        reconnect: true,
        cluster: 'group'
    },
    identity: OPTIONS.identity,
    channels: OPTIONS.channels
});
// whispers.connect();

// setTimeout(injectTests, 10 * 1000);

function injectTests() {
    // parseSelfEmotes();
    for (var num = 0; num < 20; num++) {
        addMessage({
            username: 'TyCurious',
            color: '#13a89e',
            'emote-sets': '0'
        }, `testing with a message, this should be a couple lines long and is test #${num} Kappa`, CHANNEL.name, false);
    }
}

function parseSelfEmotes(last) {
    if (!last) {
        $(`.chat_line[data-user*="${CHANNEL.name}"]`).kappa({
            emoteSize: 'small',
            customClass: 'emoticon'
        });
    } else {
        $(`.chat_line[data-user*="${CHANNEL.name}"]:last-child`).kappa({
            emoteSize: 'small',
            customClass: 'emoticon'
        });
    }
}

$.getJSON('https://api.betterttv.net/emotes', function(data) {
	var emotes = data.emotes;
	for(var i = 0; i < emotes.length; i++) {
		BTTVEmotes[i] = [emotes[i].regex,"<img class=\"emoticon\" src=\"https:" + emotes[i].url + "." + emotes[i].imageType + "\" />"];
	}
	// addSystemMessage('Loaded ' + emotes.length + ' BTTV emotes.');
});

calculateColorBackground = function(color) { // taken from KapChat - https://www.nightdev.com/kapchat/
	color = String(color).replace(/[^0-9a-f]/gi, '');
	if (color.length < 6) {
		color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
	}

	var r = parseInt(color.substr(0, 2), 16);
	var g = parseInt(color.substr(2, 2), 16);
	var b = parseInt(color.substr(4, 2), 16);
	var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
	return (yiq >= 128) ? 'dark' : 'light';
};

calculateColorReplacement = function(color, background) { // taken from KapChat - https://www.nightdev.com/kapchat/
	var inputColor = color,
		rgb = '#',
		brightness, c, i;

	color = String(color).replace(/[^0-9a-f]/gi, '');
	if (color.length < 6) {
		color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
	}

	(background === 'light') ? (brightness = '0.2') : (brightness = '-0.5');

	for (i = 0; i < 3; i++) {
		c = parseInt(color.substr(i * 2, 2), 16);
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
};

function hashColor(str) { // Cristian Sanchez - http://stackoverflow.com/a/3426956
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return '00000'.substring(0, 6 - c.length) + c;
}

function shiftColor(color, background, user) {
	if (color == null) {
		color = hashColor(user);
	}
	while(calculateColorBackground(color) !== background) {
		color = calculateColorReplacement(color, calculateColorBackground(color));
	}
	return color;
}

function parseTwitchEmotes(message, emotes, self) {
    if (!self) {
        var splitText = message.split('');
        for (var i in emotes) {
            var e = emotes[i];
            for (var j in e) {
                var mote = e[j];
                if (typeof mote == 'string') {
                    mote = mote.split('-');
                    mote = [parseInt(mote[0]), parseInt(mote[1])];
                    var length = mote[1] - mote[0],
                        empty = Array.apply(null, new Array(length + 1)).map(function () {
                            return ''
                        });
                    splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
                    splitText.splice(mote[0], 1, `<img class="emoticon" src="//static-cdn.jtvnw.net/emoticons/v1/${i}/1.0">`);
                }
            }
        }
        return splitText.join('');
    } else {
        var output = '';
        var text = message.split(' ');
        for (var i = 0; i < text.length; i++) {
            var word = text[i];
            var msgEmotes = getEmotes(self['emote-sets']);

            if (msgEmotes.has(word)) {
                console.log(msgEmotes.get(word));
                output += `<img class="emoticon" src="${emoteMap.get(word)}">`;
            }
            else {
                output += word + ' ';
            }
        }
        return output;
    }
}

function messageType(username, message) {
	if (bots.indexOf(username) > -1) {return 'bot';}
	if (message.charAt(0) == '!') {return 'command';}
	return 'standard';
}

function getDisplayName(user) {
	if (displayNames[user] == undefined) {
		$.getJSON(`https://api.twitch.tv/kraken/users/${user}`, function(data) {
			displayNames[user] = data['display_name'];
			$(`div[data-user=${user}] span.username`).text(displayNames[user]);
		});
	}
	if (displayNames[user] == undefined) {return user;}
	return displayNames[user];
}

function trimChat() {
	totalLines += 1;
	if (totalLines > maxLines) {
		$('.chat_line').first().remove();
	}
}

function parseBTTVEmotes(message) {
	for(var i = 0; i < BTTVEmotes.length; i++) {
		message = message.replace(BTTVEmotes[i][0], BTTVEmotes[i][1]);
	}
	return message;
}

function parseUserBadges(user) {
    var $newLine = $('<span></span>');
    if (typeof user['user-type'] === 'string' && user['user-type'] !== 'normal') {
        var $badge = $('<span></span>');
        $badge.addClass(user['user-type']);
        $badge.addClass('tag');
        $badge.html('&nbsp;');
        $newLine.append($badge);
    }
    if (user.username === CHANNEL.name) {
        var $badge = $('<span></span>');
        $badge.addClass('broadcaster');
        $badge.addClass('tag');
        $badge.html('&nbsp;');
        $newLine.append($badge);
    }
    ["turbo", "subscriber"].forEach(function(type) {
        if (user[type] === true) {
            var $badge = $('<span></span>');
            $badge.addClass(type);
            $badge.addClass('tag');
            $badge.html('&nbsp;');
            $newLine.append($badge);
        }
    });
    return $newLine[0].outerHTML;
}

function addMessage(user, message, channel, action, self) {
	var username = user.username;

	var type = messageType(username, message);
	var color = shiftColor(user.color, background, username);
	username = getDisplayName(username);
    var badges = parseUserBadges(user);

    var parsedMessage;
    if (!self) {
        parsedMessage = parseBTTVEmotes(parseTwitchEmotes(message, user.emotes));
    } else {
        parsedMessage = parseBTTVEmotes(parseTwitchEmotes(message, user.emotes, self));
    }

	var classes = (action == true) ? 'chat_line action' : 'chat_line';
	var msgstyle = (action == true) ? `style='color: ${color};'` : "";
	var colon = (action == true) ? ' ' : `<span class='colon'>: </span>`;
    var ts = moment().format('h:mm');

	chatBox.innerHTML += `<div class="${classes}" data-type="${type}" data-user="${username}" data-channel="${channel}"><span class="time_stamp">${ts}</span>${badges}<span class="username" style="color: ${color};">${username}</span>${colon}<span class="message" ${msgstyle}>${parsedMessage}</span></div>`;
    // parseSelfEmotes(true);
    chatBox.scrollTop = chatBox.scrollHeight;
	trimChat();
}

function addWhisper(user, message) {
    var username = getDisplayName(user.username);
    var color = shiftColor(user.color, background, username);
    var parsedMessage = parseBTTVEmotes(parseTwitchEmotes(message, user.emotes));
    var classes = 'chat_line whisper-from';
    var arrow = `<span class='arrow'><i class="fa fa-long-arrow-right"></i></span>`;
    var colon = `<span class='colon'>: </span>`;
    var ts = moment().format('h:mm');

    chatBox.innerHTML += `<div class="${classes}" data-type="whisper" data-user="${username}"><span class="time_stamp">${ts}</span><span class="username" style="color: ${color};">${username}</span> ${arrow} ${CHANNEL.name}${colon}<span class="message">${parsedMessage}</span></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    trimChat();
}

function sendMessage(message) {
    if (message && message.trim() !== '') {
        client.say(CHANNEL.name, message).then(function(data) {
        }).catch(function(err) {
            console.log(err);
        });
    }
}

function addSystemMessage(message) {
    chatBox.innerHTML += `<div class="chat_line" data-type="system"><span class="message">${message}</span></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
	trimChat();
}

var btnChat = $('.btn-chat');
btnChat.click(function(e) {
    e.preventDefault();
    sendMessage($('.chat-input').val());
    $('.chat-input').val('');
});
$('.chat-input').keydown(function(e) {
    if (e.which === 13) {
        e.preventDefault();
        if ($('.chat-input').val() !== '') {
            sendMessage($('.chat-input').val());
            $('.chat-input').val('');
        }
    }
    if (e.which === 9) {
        e.preventDefault();
    }
});

$('#btn-pop-out').click(function() {
    if (isNwjs) {
        if (window.frameElement === null) {
            console.log('Not running in iframe.');
            return false;
        } else {
            console.log('Running in iframe, popping out.');
            parent.$('.btnCollapsePanel[href*="#collapseChat"').trigger('click');
            var nw = parent.nw;
            nw.Window.open(window.location.origin + '/chat', {
                position: 'center',
                focus: true,
                width: 440,
                height: 850
            }, function (win) {
                win.on('close', function () {
                    win.hide();
                    console.log('Popout window closed.');
                    parent.$('.btnCollapsePanel[href*="#collapseChat"').trigger('click');
                    win.close(true);
                });
            });
            return false;
        }
    } else {
        $('#btn-pop-out').click(function() {
            window.open(window.location.origin + '/chat');
        });
    }
});

function getEmotes(sets) {
    if (!sets) sets = '0';
    $.getJSON(
        `https://api.twitch.tv/kraken/chat/emoticon_images?emotesets=${sets}`,
        {},
        function(res) {
            if ('emoticons' in res) {
                var emoteSet = new Map();
                res.emoticons.map((emoticon) => {
                    emoteSet.set(emoticon.code, `https://static-cdn.jtvnw.net/emoticons/v1/${emoticon.id}/3.0`);
                });
                return emoteSet;
            } else {
                setTimeout(function() {
                    getEmotes();
                }, 5 * 1000 );
            }
        }
    );
}

function getEmotesBTTV() {
    $.getJSON(
        `https://api.betterttv.net/2/channels/${CHANNEL.name}`,
        {},
        function(res) {
            if ("emotes" in res) {
                for (var i in res.emotes) {
                    emoteMap.set(res.emotes[i].regex, `https://cdn.betterttv.net/emote/${res.emotes[i].id}/1x`);
                }
            }
        }
    );
    $.getJSON(
        'https://api.betterttv.net/emotes',
        {},
        function (res) {
            if ("emotes" in res) {
                for (var i in res.emotes) {
                    emoteMap.set(res.emotes[i].regex, `https:${res.emotes[i].url}`);
                }
            }
        }
    );
}

// chat event handlers
client.on('chat', function(channel, user, message, self) {
    // if (!self) {
        return addMessage(user, message, channel, false); /*
    } else {
        console.log(user);
        console.log(message);
        return addMessage(user, message, channel, false, true);
    } */
});

client.on('action', function(channel, user, message, self) {
	addMessage(user, message, channel, true);
});

client.on('connecting', function (address, port) {
	addSystemMessage('connecting...');
});

client.on('connected', function (address, port) {
	addSystemMessage(`connected to ${CHANNEL.name}'s chat.`);
});

client.on('disconnected', function (reason) {
	addSystemMessage('Disconnected.');
});

client.on('logon', function () {
	// addSystemMessage('Logging in...');
});

client.on('reconnect', function () {
	addSystemMessage('Reconnecting...');
});

client.on('timeout', function (channel, username) {
	$(`div[data-channel=${channel}][data-user=${username}]`).remove();
});
client.on('emotesets', function(sets) {
    client.api({ url: `/chat/emoticon_images?emotesets=${sets}` },
        function(err, res, body) {
            if (err) return console.log(err);
            // console.log(body);
        }
    )
});
client.on('whisper', function(user, message) {
    console.log(user);
    console.log(`New whisper from ${user.username}: ${message}`);
    addWhisper(user, message);
});

