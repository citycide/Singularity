'use strict';

var socket = io();
var currentSong;
var animating = false;
var queue = [];

socket.on('music:update', function (data) {
    currentSong = data;
    queue.push(currentSong);
    console.log(queue[0]);
    checkQueue();
});

socket.on('music:test', function (data) {
    queue.push(data);
    console.log(queue[0]);
    checkQueue();
});

var tl, stage, opts, songTitle, command,
    lbl1, msgbgs, msg1, msg2, msg3;

var containerEl = document.getElementById('container');
var stageEl = document.createElement('canvas');

function showAlert(song) {
    animating = true;
    stageEl.id = 'notification';
    stageEl.width = 800;
    stageEl.height = 80;
    containerEl.appendChild(stageEl);

    // Define constants
    var hCenter = stageEl.width / 2;
    var vCenter = stageEl.height / 2;
    var vPos = Math.floor((200 - maxY) / 2);
    var SLANT = 50;
    var maskWidth = stageEl.width - 40;
    var maskHeight = stageEl.height - 40;
    var boxWidth = 210;
    var boxHeight = 40;
    var boxXpos = stageEl.width - boxWidth;
    var maxY = boxHeight - 4;
    var msgWidth = 500;

    stage = new createjs.Stage('notification');
    createjs.Ticker.addEventListener('tick', function(event) {
        if (event.paused) return;
        var rightEdge = 0;
        msgbgs.forEach(function(msgbg) {
            var tipX = Math.min(-(msgbg.width / 2), 0);
            var baseX = Math.min(-(msgbg.width / 2) + SLANT, 0);
            msgbg.graphics
                .clear()
                .beginFill(msgbg.color)
                .moveTo(baseX, 0)
                .lineTo(-baseX - rightEdge, 0)
                .lineTo(-baseX - rightEdge, maxY)
                .lineTo(baseX, maxY)
                .lineTo(tipX, 0)
                .closePath();
            rightEdge += 6;
        });
        lbl1.graphics
            .clear()
            .beginFill('#363636')
            .drawRect(boxXpos, 5, boxWidth, boxHeight);
        stage.update();
    });
    createjs.Ticker.setFPS(60);

    var bgContainer = new createjs.Container();
    var songContainer = new createjs.Container();
    var labelContainer = new createjs.Container();
    stage.addChild(bgContainer);
    stage.addChild(songContainer);
    stage.addChild(labelContainer);

    // Create the label box
    lbl1 = new createjs.Shape();
    lbl1.name = 'lbl1';
    lbl1.x = 300;
    lbl1.showX = 0;
    lbl1.alpha = 1;
    labelContainer.addChild(lbl1);

    // Create the text elements
    command = new createjs.Text('!CURRENTSONG', '600 22px arial', 'floralwhite');
    command.x = (stageEl.width - boxWidth) + 15;
    command.y = 12;
    command.showY = vCenter;
    command.hideY = vCenter;
    command.textAlign = 'left';
    command.mask = lbl1;
    labelContainer.addChild(command);

    // Create the three message boxes
    msg3 = new createjs.Shape();
    msg3.name = 'msg3';
    msg3.x = 1200;
    msg3.y = command.y - 5;
    msg3.showX = command.x - 212;
    msg3.alpha = 1;
    msg3.width = 500;
    bgContainer.addChild(msg3);

    msg2 = new createjs.Shape();
    msg2.name = 'msg2';
    msg2.x = msg3.x + 8;
    msg2.y = msg3.y;
    msg2.showX = msg3.showX + 18;
    msg2.alpha = 1;
    msg2.width = msg3.width + 20;
    bgContainer.addChild(msg2);

    msg1 = new createjs.Shape();
    msg1.name = 'msg1';
    msg1.x = msg2.x + 8;
    msg1.y = msg2.y;
    msg1.showX = msg2.showX + 18;
    msg1.alpha = 1;
    msg1.width = msg2.width + 20;
    bgContainer.addChild(msg1);

    msgbgs = [msg3, msg2, msg1];

    songTitle = new createjs.Text(song, '600 22px arial', 'floralwhite');
    songTitle.x = 1200;
    songTitle.y = 12;
    songTitle.showX = (stageEl.width - boxWidth - msg3.width) + 140;
    songTitle.showY = 12;
    songTitle.textAlign = 'left';
    songTitle.mask = msg1;
    songTitle.maxLength = 359;
    songContainer.addChild(songTitle);
    // console.log(songTitle.getBounds());

    // Create the timeline that will animate elements
    tl = new TimelineLite({
        autoRemoveChildren: true,
        onComplete: function () {
            animating = false;
            checkQueue();
        } });
    tl.restart();
    tl.timeScale(1);
    // Set the variables
    var firstMsg = song;
    var secondMsg = 'CITYCIDE';

    // Define constants
    var DELAY_INCREMENT = 0.09;
    var colorPallette = [
        '#13a89e',
        '#363636',
        '#13a89e'
    ];
    opts = opts || {};
    opts.colors = opts.colors || colorPallette;

    // Prepare the elements for staggering animations
    var reverseBgs = msgbgs.slice().reverse();
    var foremostMsg = window.msgbgs[2];
    var delay = 0;

    // Animate in
    tl.add('npIn');

    tl.call(function() {
        var len = msgbgs.length;
        for (var i = 0; i < len; i++) {
            msgbgs[i].color = opts.colors[i];
        }
        // createjs.Sound.play(opts.inSound).volume = soundVolumes.value.inVolume;
    }, null, null, 'npIn');

    tl.to(lbl1, 0.6, {
        x: lbl1.showX,
        ease: Power3.easeInOut
    }, 'npIn');

    // Animate in
    tl.add('npTitle');

    msgbgs.forEach(function(msgbg) {
        tl.to(msgbg, 0.6, {
            x: msgbg.showX,
            y: msgbg.showY,
            ease: Elastic.easeOut.config(0.75, 1.25)
        }, 'npTitle+=' + delay);
        delay += DELAY_INCREMENT;
    });

    tl.to(songTitle, 0.6, {
        x: songTitle.showX,
        y: songTitle.showY,
        ease: Elastic.easeOut.config(1, 1)
    }, 'npTitle');

    if (songTitle.getBounds().width > songTitle.maxLength) {
        tl.to(songTitle, 1, {
            x: (songTitle.showX - (songTitle.getBounds().width - songTitle.maxLength)) - 15
        }, 'npTitle+=' + 2);

        tl.to(songTitle, 1, {
            x: songTitle.showX
        }, '+=' + 3);
    } else {
        tl.to({}, 5, {});
    }

    // Animate out
    tl.add('npOut', '+=3');

    tl.to(songTitle, 0.6, {
        x: songTitle.x,
        y: songTitle.y,
        ease: Elastic.easeIn.config(1, 1)
    }, 'npOut');

    delay = 0;

    reverseBgs.forEach(function(msgbg) {
        tl.to(msgbg, 0.6, {
            x: msgbg.x,
            y: msgbg.y,
            ease: Elastic.easeIn.config(0.75, 0.75)
        }, 'npOut+=' + delay);
        delay += DELAY_INCREMENT;
    });

    tl.to(lbl1, 0.6, {
        x: lbl1.x,
        ease: Power3.easeInOut
    }, '+=');

    tl.call(function() {
        // createjs.Sound.play('out').volume = soundVolumes.value.outVolume;
    }, null, null, 'npOut');

    // Kill time between successive notifications
    tl.to({}, 1, {});
}

function checkQueue() {
    if(!queue.length || animating) {
        setTimeout(checkQueue, 5 * 1000);
        return;
    }
    var newSong = queue.pop();
    console.log(newSong);
    showAlert(newSong);
}