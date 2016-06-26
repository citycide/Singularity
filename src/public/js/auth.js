/* prevent lint errors on EJS variables & fetch */
/* global clientID, setupComplete, fetch */

const socket = io();

$(() => {
    const accessToken = `oauth:${window.location.hash.substring(14, 44)}`;
    const KRAKEN = `https://api.twitch.tv/kraken`;

    (async function() {
        const response = await fetch(`${KRAKEN}?oauth_token=${accessToken.slice(6)}&client_id=${clientID}`);
        const json = await response.json();

        if ('token' in json) {
            const resolved = await fetch(`${KRAKEN}/users/${json.token.user_name}`);
            const userObj = await resolved.json();

            let logo = (userObj.logo === null)
                ? 'http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png'
                : userObj.logo;

            socket.emit('auth:callback', {
                token: accessToken,
                user: json.token.user_name,
                logo,
                id: userObj._id
            });

            if (setupComplete) {
                window.location.assign(`${window.location.origin}/setup#done`);
            } else {
                window.location.assign(window.location.origin);
            }
        } else {
            // probably should show some kind of error in the UI for this
            window.location.assign(`${window.location.origin}/login`);
        }
    })();
});
