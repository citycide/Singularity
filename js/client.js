var gui = require('nw.gui');
var socket = io();

function sendFollowTest() {
    $("#btnTestFollower").click(function() {
        var user = $("#testFollowerUser").val();
        socket.emit('newFollower', user);
        console.log('Sent follower test with name: ' + user);
        return false;
    });
}

var winAlerts;
$('a#openAlerts').click(function() {
    winAlerts = gui.Window.open('public/index.html', {
        position: 'center',
        width: 1280,
        height: 720
    });
});

winAlerts.on('closed', function() {
  winAlerts = null;
});

gui.Window.get().on('close', function() {
  this.hide();
  if (winAlerts != null) winAlerts.close(true);
  this.close(true);
});
