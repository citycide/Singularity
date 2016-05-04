'use strict';

var socket = io();

socket.on('alert:tip', function (data) {
    showAlert(data);
});

/**
 * @function Register & preload sounds
 */
(function() {
    createjs.Sound.registerSound('/views/overlays/snd/subscription.ogg', 'tip');
    // createjs.Sound.registerSound('/views/overlays/snd/tip.ogg', 'tip');
    createjs.Sound.registerSound('/views/overlays/snd/short_whoosh2.wav', 'cut');
    createjs.Sound.registerSound('/views/overlays/snd/short_whoosh1.wav', 'out');
})();


var tl, stage, opts, username, amount,
    bgs, bg1, bg2, bg3;

var containerEl = document.getElementById('container');
var stageEl = document.createElement('canvas');

function showAlert(user) {
    stageEl.id = 'notification';
    stageEl.width = 1000;
    stageEl.height = 200;
    containerEl.appendChild(stageEl);

    // Define constants
    var hCenter = stageEl.width / 2;
    var vCenter = stageEl.height / 2;
    var SLANT = 50;
    var maxX = stageEl.width - SLANT;
    var maxY = stageEl.height / 2.5;
    var vPos = Math.floor((200 - maxY) / 2);

    stage = new createjs.Stage('notification');
    createjs.Ticker.addEventListener('tick', function(event) {
        if (event.paused) return;

        bgs.forEach(function(bg) {
            // The two left side x values will be inverted to get right side x values.
            var tipX = Math.min(-(bg.width / 2), 0);
            var baseX = Math.min(-(bg.width / 2) + SLANT, 0);
            bg.graphics
                .clear()
                .beginFill(bg.color)
                .moveTo(baseX, 0)
                .lineTo(-baseX, 0)
                .lineTo(-tipX, maxY / 2)
                .lineTo(-baseX, maxY)
                .lineTo(baseX, maxY)
                .lineTo(tipX, maxY / 2)
                .closePath();
        });
        stage.update();
    });

    createjs.Ticker.setFPS(60);

    var bgContainer = new createjs.Container();
    var nameContainer = new createjs.Container();
    var amtContainer = new createjs.Container();
    var iconContainer = new createjs.Container();
    stage.addChild(bgContainer);
    stage.addChild(nameContainer);
    stage.addChild(amtContainer);
    stage.addChild(iconContainer);

    // Create the avatar element
    var icon = new createjs.Bitmap("/views/overlays/images/SupportJar.png");
    icon.name = 'icon';
    var scaleFactor = 0.25;
    icon.scaleX = 0;
    icon.scaleY = 0;
    icon.maxScaleX = scaleFactor;
    icon.maxScaleY = scaleFactor;
    icon.x = hCenter;
    icon.y = vCenter;
    icon.endX = hCenter - ((500 * scaleFactor) / 2);
    icon.endY = vCenter - ((500 * scaleFactor) / 2);
    iconContainer.addChild(icon);

    // Create the three message boxes
    bg3 = new createjs.Shape();
    bg3.name = 'bg3';
    bg3.x = hCenter;
    bg3.y = vPos;
    bg3.maxWidth = 950;
    bg3.width = 0;
    bgContainer.addChild(bg3);

    bg2 = new createjs.Shape();
    bg2.name = 'bg2';
    bg2.x = hCenter;
    bg2.y = vPos;
    bg2.maxWidth = bg3.maxWidth - 15;
    bg2.width = 0;
    bgContainer.addChild(bg2);

    bg1 = new createjs.Shape();
    bg1.name = 'bg1';
    bg1.x = hCenter;
    bg1.y = vPos;
    bg1.maxWidth = bg2.maxWidth - 15;
    bg1.width = 0;
    bgContainer.addChild(bg1);

    // Place all the background elements into an array to make staggered tweens easier
    bgs = [bg3, bg2, bg1];

    // Create the text elements
    username = new createjs.Text(' ', '600 40px UniversLtCon', 'floralwhite');
    username.x = hCenter - 385;
    username.showY = vCenter - 26;
    username.hideY = vCenter - 45;
    username.y = vCenter - 40;
    username.textAlign = 'left';
    username.mask = bg1;
    username.maxWidth = 600;
    nameContainer.addChild(username);

    amount = new createjs.Text(' ', '600 45px UniversLtCon', 'floralwhite');
    amount.x = hCenter + 385;
    amount.showY = vCenter - 28;
    amount.hideY = vCenter - 50;
    amount.y = vCenter - 45;
    amount.textAlign = 'right';
    amount.mask = bg1;
    amount.maxWidth = 600;
    amtContainer.addChild(amount);

    // Load sounds
    createjs.Sound.registerSound('/views/overlays/snd/subscription.ogg', 'tip');
    // createjs.Sound.registerSound('/views/overlays/snd/tip.ogg', 'tip');
    createjs.Sound.registerSound('/views/overlays/snd/short_whoosh2.wav', 'cut');
    createjs.Sound.registerSound('/views/overlays/snd/short_whoosh1.wav', 'out');

    tl = new TimelineMax({
        autoRemoveChildren: true,
        onComplete: function () {
            socket.emit('alertComplete');
        }
    });

    tl.timeScale(1);
    var container = $('#container');
    container.mouseenter(
        function setPlaySpeed() {
            tl.timeScale(0.05);
        }
    );
    container.mouseleave(
        function setPlaySpeed() {
            tl.timeScale(1);
        }
    );

    // Set the variables
    var firstMsg = user.name;
    var secondMsg = user.amount;

    // Define constants
    var DELAY_INCREMENT = 0.03;
    var bgColors = [
        '#13a89e',
        '#363636',
        '#13a89e'
    ];
    opts = opts || {};
    opts.colors = opts.colors || bgColors;

    // Prepare the elements for staggering animations
    var reverseBgs = window.bgs.slice(0).reverse();
    // var foremostBg = window.bgs[0];
    var delay = 0;

    // Animate in
    tl.add('npIn');

    // Initiate the elements
    tl.call(function() {
        var len = bgs.length;
        for (var i = 0; i < len; i++) {
            bgs[i].color = opts.colors[i];
        }
        username.text = firstMsg;
        amount.text = secondMsg;
        icon.image.src = '/views/overlays/images/SupportJar.png';
        createjs.Sound.play('tip').volume = 0.65;
    }, null, null, 'npIn');

    // Show the icon
    tl.to(icon, 0.6, {
        x: icon.endX,
        y: icon.endY,
        scaleX: icon.maxScaleX,
        scaleY: icon.maxScaleY,
        ease: Elastic.easeOut.config(1, 0.5)
    }, 'npIn');

    tl.add('npActive', '-=0.35');

    // Show the backgrounds
    reverseBgs.forEach(function(bg) {
        tl.to(bg, 0.6, {
            width: bg.maxWidth,
            ease: Elastic.easeOut.config(0.5, 0.5)
        }, 'npActive+=' + delay);
        delay += DELAY_INCREMENT;
    });

    // Show username
    tl.to(username, 0.6, {
        onStart: function() {
            createjs.Sound.play('cut').volume = 1;
        },
        y: username.showY,
        ease: Back.easeOut.config(4),
        autoRound: false
    }, 'npActive+=' + (delay - DELAY_INCREMENT));

    // Show amount
    tl.to(amount, 0.6, {
        y: amount.showY,
        ease: Elastic.easeOut.config(1, 1)
    }, 'npActive+=' + (delay - DELAY_INCREMENT));

    // Animate out
    delay = 0;

    tl.add('npOut', '+=8');

    tl.call(function() {
        // createjs.Sound.play('out').volume = 0.6;
    }, null, null, 'npOut');

    bgs.forEach(function(bg) {
        tl.to(bg, 0.6, {
            width: 0,
            ease: Elastic.easeIn.config(0.3, 0.4)
        }, 'npOut+=' + delay);
        delay += DELAY_INCREMENT;
    });

    // Hide the icon
    tl.to(icon, 0.6, {
        onStart: function() {
            createjs.Sound.play('cut').volume = 0.6;
        },
        x: icon.x,
        y: icon.y,
        scaleX: icon.scaleX,
        scaleY: icon.scaleY,
        ease: Elastic.easeIn.config(1, 0.7)
    }, 'npOut+=' + 0.5);

    // Hide username
    tl.to(username, 0.6, {
        y: username.hideY,
        ease: Elastic.easeIn.config(1, 1)
    }, 'npOut+=' + delay);

    // Hide amount
    tl.to(amount, 0.6, {
        y: amount.hideY,
        ease: Elastic.easeIn.config(1, 1)
    }, 'npOut+=' + delay);

    // Kill time between successive notifications
    tl.to({}, 2.5, {});
}