var queue = [],
    followers = {},
    animating = false,
    channel = 'citycide',
    pollInterval = 7000,
    dev = true,
    devDirection = (dev) ? 'asc' : 'desc';

var tl, stage, label, opts,
    circlebgs, cir1, cir2, cir3,
    msgbgs, msg1, msg2, msg3;

function initFollowers(offset) {
    offset = offset || 0;

    $.getJSON('https://api.twitch.tv/kraken/channels/'+channel+'/follows?direction='+devDirection+'&limit=100&callback=?', function(data) {
        if (data.follows.length === 0) {
            // initial list is empty so poll for followers
            setTimeout(function(){
                pollFollowers();
            }, pollInterval);
        }

        if (data.follows && data.follows.length > 0) {
            data.follows.forEach(function (follower) {
                followers[follower.user.name] = true;
            });

            if (!dev) {
                initFollowers(offset + 100);
            } else {
                setTimeout(function () {
                    pollFollowers();
                }, pollInterval);
            }
        }
    }).fail(function() {
        setTimeout(function () {
            initFollowers(offset);
        }, pollInterval);
    });
}

function pollFollowers() {
    $.getJSON('https://api.twitch.tv/kraken/channels/'+channel+'/follows?direction=desc&limit=100&callback=?', function(data) {
        if (data.follows) {
            data.follows.forEach(function(follower) {
                if (!followers[follower.user.name]) {
                    followers[follower.user.name] = true;
                    queue.push(follower.user);
                    checkQueue();
                }
            });
        }
    });
}

function checkQueue() {
    if(!queue.length || animating) return;
    newFollower(queue.shift());
}

var timer = false;
function newFollower(user) {
    animating = true;
    showAlert(user);
}

var containerEl = document.getElementById('container');
var stageEl = document.createElement('canvas');

function showAlert(user) {
    // Create the canvas element that will become the render target.
    // EaselJS calls this a "stage".
    stageEl.id = 'notification';
    stageEl.width = 800;
    stageEl.height = 200;
    containerEl.appendChild(stageEl);

    // Define constants
    var initRadius = 0;
    var maxRadius = 60;
    var midRadius = maxRadius - 5;
    var minRadius = midRadius - 5;
    var hCenter = stageEl.width / 2;
    var vCenter = stageEl.height / 2;
    var SLANT = 40;
    var maxX = stageEl.width - SLANT;
    var maxY = stageEl.height / 2.25;
    var vPos = Math.floor((200 - maxY) / 2);

    // Create the stage on the target canvas, and create a ticker that will render at 60 fps.
    stage = new createjs.Stage('notification');
    createjs.Ticker.addEventListener('tick', function(event) {
        if (event.paused) return;
        var nextRadius = maxRadius;

        circlebgs.forEach(function(circlebg) {
            circlebg.graphics
                .clear()
                .beginFill(circlebg.color)
                .arc(hCenter, vCenter, nextRadius, 0, Math.PI*2);
            nextRadius = nextRadius - 5;
        });
        msgbgs.forEach(function(msgbg) {
            // The two left side x values will be inverted to get right side x values.
            var tipX = Math.min(-(msgbg.width / 2), 0);
            var baseX = Math.min(-(msgbg.width / 2) + SLANT, 0);
            msgbg.graphics
                .clear()
                .beginFill(msgbg.color)
                .moveTo(baseX, 0)
                .lineTo(-baseX, 0)
                .lineTo(-tipX, maxY / 2)
                .lineTo(-baseX, maxY)
                .lineTo(baseX, maxY)
                .closePath();
        });
        stage.update();
    });

    createjs.Ticker.setFPS(60);

    var bgContainer = new createjs.Container();
    var msgContainer = new createjs.Container();
    var txtContainer = new createjs.Container();
    var logoContainer = new createjs.Container();
    stage.addChild(bgContainer);
    stage.addChild(msgContainer);
    stage.addChild(txtContainer);
    stage.addChild(logoContainer);

    // Create the three avatar background elements
    cir3 = new createjs.Shape();
    cir3.name = 'cir3';
    cir3.maxRadius = maxRadius;
    cir3.scaleX = 0;
    cir3.scaleY = 0;
    cir3.x = hCenter;
    cir3.y = vCenter;
    bgContainer.addChild(cir3);

    cir2 = new createjs.Shape();
    cir2.name = 'cir2';
    cir2.maxRadius = midRadius;
    cir2.scaleX = 0;
    cir2.scaleY = 0;
    cir2.x = hCenter;
    cir2.y = vCenter;
    bgContainer.addChild(cir2);

    cir1 = new createjs.Shape();
    cir1.name = 'cir1';
    cir1.maxRadius = minRadius;
    cir1.scaleX = 0;
    cir1.scaleY = 0;
    cir1.x = hCenter;
    cir1.y = vCenter;
    bgContainer.addChild(cir1);

    // Create the avatar element
    var logo = new createjs.Bitmap("http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png");
    logo.name = 'logo';
    logo.mask = cir1;
    var scaleFactor = 0.39;
    logo.scaleX = scaleFactor;
    logo.scaleY = scaleFactor;
    logo.x = hCenter - 59;
    logo.y = vCenter - 59;
    logoContainer.addChild(logo);
    bgContainer.addChild(logoContainer);

    // Create the three message boxes
    msg3 = new createjs.Shape();
    msg3.name = 'msg3';
    msg3.x = hCenter + 30;
    msg3.y = vPos;
    msg3.maxWidth = 670;
    msg3.width = 0;
    msgContainer.addChild(msg3);

    msg2 = new createjs.Shape();
    msg2.name = 'msg2';
    msg2.x = msg3.x - 10;
    msg2.y = vPos;
    msg2.maxWidth = msg3.maxWidth - 5;
    msg2.width = 0;
    msgContainer.addChild(msg2);

    msg1 = new createjs.Shape();
    msg1.name = 'msg1';
    msg1.x = msg2.x - 10;
    msg1.y = vPos;
    msg1.maxWidth = msg2.maxWidth - 5;
    msg1.width = 0;
    msgContainer.addChild(msg1);

    // Create the text element
    label = new createjs.Text(' ', '600 40px arial', '#F7F2E8');
    label.x = hCenter + 25;
    label.showY = vCenter - 30;
    label.hideY = vCenter - 45;
    label.y = vCenter - 45;
    label.textAlign = 'center';
    label.mask = msg1;
    label.maxWidth = 600;
    txtContainer.addChild(label);

    // Bring bgContainer to the front
    stage.setChildIndex(bgContainer, stage.getNumChildren()-1);

    // Put all the background elements into an array to make the tweens easier to write
    circlebgs = [cir3, cir2, cir1];
    msgbgs = [msg3, msg2, msg1];

    // Load sounds
    createjs.Sound.registerSound('snd/subscription.mp3', 'subscription');
    createjs.Sound.registerSound('snd/tip.mp3', 'tip');
    createjs.Sound.registerSound('snd/cut.mp3', 'cut');
    createjs.Sound.registerSound('snd/out.mp3', 'out');

    // Create the timeline that will animate elements
    tl = new TimelineMax({
        autoRemoveChildren: true,
        onComplete: function () {
                animating = false;
                checkQueue();
        }
    });

    tl.timeScale(1);
    $('#container').mouseenter(
      function setPlaySpeed() {
        tl.timeScale(0.05);
      }
    );
    $('#container').mouseleave(
      function setPlaySpeed() {
        tl.timeScale(1);
      }
    );

    // Set the variables
    var firstMsg = 'NEW FOLLOWER';
    var secondMsg = user.display_name;

    // Define constants
    var DELAY_INCREMENT = 0.09;
    var SUB_COLORS = [
        '#13a89e',
        '#363636',
        '#13a89e'
    ];
    opts = opts || {};
    opts.colors = opts.colors || SUB_COLORS;

    // Prepare the elements for staggering animations
    var reverseBgs = window.circlebgs.slice(0).reverse();
    var reverseMsg = window.msgbgs.slice(0).reverse();
    var foremostBg = window.circlebgs[2];
    var foremostMsg = window.msgbgs[2];
    var delay = 0;

    // Animate in
    tl.add('npIn');

    tl.call(function() {
        var len = circlebgs.length;
        for (var i = 0; i < len; i++) {
            circlebgs[i].color = opts.colors[i];
            msgbgs[i].color = opts.colors[i];
        }
        logo.image.src = (user.logo) ? user.logo : 'http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png';
        foremostBg.alpha = 0;
        createjs.Sound.play('subscription').volume = 1;
    }, null, null, 'npIn');

    circlebgs.forEach(function(circlebg) {
        tl.to(circlebg, 0.6, {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            ease: Elastic.easeOut.config(1, 1)
        }, 'npIn+=' + delay);
        delay += DELAY_INCREMENT;
    });

    tl.to(bgContainer, 0.6, {
        x: -300,
        ease: Elastic.easeOut.config(1, 1)
    }, '-=0.05');

    msgbgs.forEach(function(msgbg) {
        tl.to(msgbg, 0.6, {
            width: msgbg.maxWidth,
            ease: Elastic.easeOut.config(1, 1)
        }, '-=0.6');
        // delay += DELAY_INCREMENT;
    });

    // Show first message
    tl.to(label, 0.6, {
        onStart: function () {
            // label.font = FIRST_MSG_FONT;
            label.text = firstMsg;
        },
        y: label.showY + 7,
        ease: Back.easeOut.config(4),
        autoRound: false
    }, '-=0.70');

    // Hide first message
    tl.to(label, 0.6, {
        onStart: function() {
            createjs.Sound.play('cut').volume = 1;
        },
        y: 300,
        ease: Elastic.easeIn.config(1, 1),
        onComplete: function () {
            // label.font = SECOND_MSG_FONT;
            label.text = secondMsg;
        }
    }, '+=0.875');

    // Show second message
    tl.to(label, 0.6, {
        onStart: function() {
            // createjs.Sound.play('cut').volume = 1;
        },
        y: label.showY + 7,
        ease: Elastic.easeOut.config(1, 1),
        onComplete: function () {
            // label.font = SECOND_MSG_FONT;
            label.text = secondMsg;
        }
    }, '+=0');

    // Animate out
    delay = 0;

    tl.add('npOut', '+=4');

    tl.call(function() {
        createjs.Sound.play('out').volume = 1;
    }, null, null, 'npOut');

    reverseBgs.forEach(function(circlebg) {
        tl.to(circlebg, 0.4, {
            x: hCenter,
            y: vCenter,
            scaleX: 0,
            scaleY: 0,
            ease: Elastic.easeIn.config(1, 1)
        }, 'npOut+=' + delay);
        delay += DELAY_INCREMENT;
    });

    tl.to(bgContainer, 0.6, {
        x: 0,
        ease: Elastic.easeOut.config(1, 1)
    }, '-=0.5');

    // Start hiding second message
    tl.to(label, 0.6, {
        onStart: function() {
            createjs.Sound.play('cut').volume = 1;
        },
        y: label.hideY,
        ease: Elastic.easeOut.config(1, 1),
        onComplete: function () {
            // label.font = SECOND_MSG_FONT;
            label.text = secondMsg;
        }
    }, '-=0.63');

    msgbgs.forEach(function(msgbg) {
        tl.to(msgbg, 0.6, {
            width: 0,
            ease: Elastic.easeIn.config(1, 1)
        }, '-=1.074');
    });

    // Kill time between successive notifications
    tl.to({}, 1.5, {});
}

initFollowers();
