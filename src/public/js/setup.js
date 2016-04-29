$(window).load(function() {
    setTimeout(function() {
        $('body').addClass('loaded');
    }, 200);
});

$(document).ready(function () {
    var socket = io();

    var loc = window.location;
    var locHash = loc.hash.toString();
    if (locHash == '#done') {
        $('ul.nav li a[href="' + locHash + '"]').parent().removeClass('disabled');
        $('ul.nav li a[href="' + locHash + '"]').trigger('click');
        socket.emit('setupComplete');
    }

    $('.btn-submit').on('click', function (e) {
        var formname = $(this).attr('name');
        var tabname = $(this).attr('href');

        if ($('#' + formname)[0].checkValidity()) {
            e.preventDefault();
            $('ul.nav li a[href="' + tabname + '"]').parent().removeClass('disabled');
            $('ul.nav li a[href="' + tabname + '"]').trigger('click');
        }
    });

    $('ul.nav li').on('click', function (e) {
        if ($(this).hasClass('disabled')) {
            e.preventDefault();
            return false;
        }
    });

    $('.btn-setupComplete').on('click', function (e) {
        e.preventDefault();
        window.location.href = window.location.origin;
        return false;
    });
});