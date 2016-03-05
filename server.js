var port = 2882;

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(port, function() {
    console.log('listening on *:' + port);
});

app.use(express.static('./public'));

io.on('connection', function(client) {

    console.log('Client connected...');

    client.on('newFollower', function(data) {
        console.log(data);
        client.emit('newfollow', data);
    });
    client.on('newhoster', function(data) {
        console.log(data);
        client.emit('newhoster', data);
    });
    client.on('newdonation', function(data) {
        console.log(data);
        client.emit('newdonation', data);
    });
    client.on('newsubscriber', function(data) {
        console.log(data);
        client.emit('newsubscriber', data);
    });
    client.on('resubscriber', function(data) {
        console.log(data);
        client.emit('resubscriber', data);
    });
});