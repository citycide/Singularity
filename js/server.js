var port = 2882;

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(port);

io.on('connection', function(client) {

    console.log('Client connected...');

    /*
    client.on('newfollow', function(data) {
        console.log(data);
        client.broadcast.emit('newfollow', data);
    });
    client.on('newhoster', function(data) {
        console.log(data);
        client.broadcast.emit('newhoster', data);
    });
    client.on('newdonation', function(data) {
        console.log(data);
        client.broadcast.emit('newdonation', data);
    });
    client.on('newsubscriber', function(data) {
        console.log(data);
        client.broadcast.emit('newsubscriber', data);
    });
    client.on('resubscriber', function(data) {
        console.log(data);
        client.broadcast.emit('resubscriber', data);
    });
    */
});
app.use(express.static('./public'));

server.listen(port, function() {
    console.log('listening on *:' + port);
});

$("#btnTestFollower").click(function() {
    var user = $("#testFollowerUser").val();
    io.emit('newFollower', user);
    console.log('Sent follower test with name: ' + user);
    return false;
});