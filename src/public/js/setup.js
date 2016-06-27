$(window).load(() => {
    setTimeout(() => {
        $('body').addClass('loaded');
    }, 200);
});

$(() => {
    const socket = io();

    const loc = window.location;
    const locHash = loc.hash.toString();
    if (locHash === '#done') {
        $(`ul.nav li a[href="${locHash}"]`).parent().removeClass('disabled');
        $(`ul.nav li a[href="${locHash}"]`).trigger('click');
        socket.emit('setup:complete');
    }

    $('.btn-submit').on('click', function(e) {
        const tabName = $(this).attr('href');

        e.preventDefault();
        $(`ul.nav li a[href="${tabName}"]`).parent().removeClass('disabled');
        $(`ul.nav li a[href="${tabName}"]`).trigger('click');
    });

    $('ul.nav li').on('click', function(e) {
        if ($(this).hasClass('disabled')) {
            e.preventDefault();
            return false;
        }
    });

    $('.btn-setupComplete').on('click', e => {
        e.preventDefault();
        window.location.href = window.location.origin;
        return false;
    });
});
