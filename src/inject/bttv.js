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

{
	const script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'https://cdn.betterttv.net/betterttv.js?' + Math.random();
	const head = document.getElementsByTagName('head')[0];
	if (head) head.appendChild(script);
}
