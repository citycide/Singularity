import moment from 'moment';
import 'moment-duration-format';

const twitchAPI = {
    settings: {
        API_OPTIONS: {
            method: 'GET',
            headers: {
                "Accept": "application/vnd.twitchtv.v3+json",
                "Authorization": `OAuth ${Settings.get('accessToken').slice(6)}`,
                "Client-ID": Settings.get('clientID')
            }
        }
    },
    resolveUser(username) {
        const opts = Object.assign({
            url: `https://api.twitch.tv/kraken/users/${username}`
        }, this.settings.API_OPTIONS);

        $.api(opts, (err, res, body) => {
            if (err) return Logger.error(err);

            if (body) {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    Logger.error(e);
                    return;
                }
            } else {
                return;
            }

            if (body.error && body.status === 404) return false;

            if (body.display_name) return body.display_name;
        });
    },
    getStreamInfo() {
        const opts = Object.assign({
            url: `https://api.twitch.tv/kraken/streams/${$.channel.name}?ts=${Date.now()}`
        }, this.settings.API_OPTIONS);

        let isLive = false;
        let game = null;
        let status = null;
        let uptime = 0;

        $.api(opts, (err, res, body = {}) => {
            if (err) {
                Logger.bot(err);
                return;
            }

            if (body.stream) {
                isLive = true;
                game = body.stream.game || null;
                status = body.stream.channel.status || null;

                const createdTime = moment(body.stream.created_at).valueOf();
                const timeSince = moment().valueOf() - createdTime;
                uptime = moment()
                    .duration(timeSince, 'milliseconds')
                    .format('h [h], m [m], s [s]');
            }

            $.stream = Object.assign({}, {
                isLive,
                game,
                status,
                uptime
            });
        });

        $.tick.setTimeout('getChatUsers', this.getStreamInfo.bind(this), 30 * 1000);
    },
    /**
     * @function getChatUsers()
     * @description updates the viewer list
     * @returns {Array}
     **/
    getChatUsers() {
        let users = [];
        let userCount = 0;

        const opts = Object.assign({
            url: `https://tmi.twitch.tv/group/user/${$.channel.name}/chatters?ts=${new Date().getTime()}`
        }, this.settings.API_OPTIONS);

        $.api(opts, (err, res, body = {}) => {
            if (err) {
                Logger.bot(err);
                return;
            }

            userCount = body.chatter_count || 0;
            if (userCount < 1) return;

            if (body.chatters.staff) {
                for (let user of body.chatters.staff) {
                    users.push(user);
                }
            }

            if (body.chatters.moderators) {
                for (let user of body.chatters.moderators) {
                    users.push(user);
                }
            }

            if (body.chatters.admin) {
                for (let user of body.chatters.admin) {
                    users.push(user);
                }
            }

            if (body.chatters.global_mods) {
                for (let user of body.chatters.global_mods) {
                    users.push(user);
                }
            }

            if (body.chatters.viewers) {
                for (let user of body.chatters.viewers) {
                    users.push(user);
                }
            }
        });


        $.user.list = users;
        $.user.count = userCount;

        $.tick.setTimeout('getChatUsers', this.getChatUsers.bind(this), 30 * 1000);

        return users;
    }
};

$.on('bot:ready', () => {
    $.user.list = [];
    $.user.count = 0;

    $.user.resolve = twitchAPI.resolveUser;

    $.stream = Object.assign({}, {
        isLive: false,
        game: null,
        status: null,
        uptime: 0
    });

    twitchAPI.getStreamInfo();
    twitchAPI.getChatUsers();
});
