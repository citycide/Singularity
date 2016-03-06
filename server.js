var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = process.env.PORT || 2016;

app.use(express.static(__dirname + "/public"));

server.listen(port, function(){
    console.log('SYS: listening on *:' + port);
});

io.on('connection', function(socket){
    console.log('SYS: Client connected.');

    socket.on('disconnect', function(){
        console.log('SYS: Client disconnected');
    });

    socket.on('newFollower', function(data){
        console.log('Received follower test.');
    });
});