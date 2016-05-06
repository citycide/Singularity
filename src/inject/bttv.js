// ==UserScript==
// @name            BetterTTV
// @namespace       BTTV
// @description     Enhances Twitch with new features, bug fixes, and reduced clutter.
// @copyright       NightDev
// @icon            http://cdn.betterttv.net/icon.png
//
// @grant           none
//
// @include         *://*.twitch.tv/*
//
// @version         0.0.1
// ==/UserScript==

document.addEventListener('DOMContentLoaded', () => {
	const script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'https://cdn.betterttv.net/betterttv.js?' + Math.random();
	const head = document.getElementsByTagName('head')[0];
	if (head) head.appendChild(script);

    if (typeof(jQuery) === 'undefined') {
        if (!injected) {
            const jq = document.createElement('script');
            jq.type = 'text/javascript';
            jq.src = 'https://code.jquery.com/jquery-2.2.3.min.js';
            if (head) head.appendChild(jq);
        }
    }
/*
	setTimeout(() => {
		$('.button-simple .dark .openSettings').click(() => {
            Emitter.fire('window:bttv:settings');
            return false;
        });
	}, 2000); */
});