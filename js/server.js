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
    console.log('TEST: Sent follower test with name: ' + user + '.');
    return false;
});

$("#btnTestHost").click(function() {
    var user = $("#testHostUser").val();
    var viewers = parseInt($("#testHostViewers").val());
    io.emit('newHoster', [user, viewers]);
    console.log('TEST: Sent host test with: ' + user + ' for ' + viewers + ' viewers.');
    return false;
});

$("#btnTestSub").click(function() {
    var user = $("#testSubUser").val();
    var months = parseInt($("#testSubMonths").val());
    if (months === null || months === undefined || months === 0 || isNaN(months)) {
        io.emit('newSubscriber', user);
        console.log('TEST: Sent new subscriber test with name: ' + user + '.');
    } else {
        io.emit('newResub', [user, months]);
        console.log('TEST: Sent resubscriber test with: ' + user + ' for ' + months + ' months.');
    }
    return false;
});

$("#btnTestDonation").click(function() {
    var user = $("#testDonationUser").val();
    var amount = parseInt($("#testDonationAmt").val());
    var message = $("#testDonationMsg").val();
    io.emit('newDonation', [user, amount, message]);
    if (message === "" || message === null || message === undefined) {
        console.log('TEST: Sent new donation test from: ' + user + ' for '
            + '$' + amount + '.');
    } else {
        console.log('TEST: Sent new donation test from: ' + user + ' for '
            + '$' + amount + ', and message ' + message);
    }
    return false;
});