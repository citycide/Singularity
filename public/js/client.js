var mainwin,
    gui,
    socket;

$(document).ready( function() {
    gui = require('nw.gui');
    socket = io.connect('http://localhost:2882');

    mainwin = gui.Window.get();
    mainwin.on("close", function() {
        this.hide();
        console.log("collapsing the singularity...");
        this.close(true);
    });

    $('[data-toggle="tooltip"]').tooltip();

    var btnOpenAlerts = $('a#openAlerts');
    btnOpenAlerts.click(function () {
        var winAlerts = gui.Window.open('http://localhost:2882/', {
            position: 'center',
            width: 850,
            height: 275
        });

        winAlerts.on('closed', function () {
            winAlerts = null;
        });

        gui.Window.get().on('close', function () {
            this.hide();
            if (winAlerts != null) winAlerts.close(true);
            this.close(true);
        });
        return false;
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

});
