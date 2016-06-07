module.exports.points = (event) => {
    let action = event.args[0];
    let param1 = event.args[1];
    let param2 = event.args[2] || null;

    switch (action) {
        case 'add':
            $.points.add(param1, param2);
            $.say(event.sender, `${param1} now has ${$.points.get(param1)} points.`);
            break;
        case 'remove':
            $.points.sub(param1, param2);
            $.say(event.sender, `${param1} now has ${$.points.get(param1)} points.`);
            break;
        default:
            $.say(event.sender, `${action} has ${$.points.get(action)} points.`);
    }
};

(() => {
    $.addCommand('points', './modules/main/points', {
        cooldown: 0
    });

    $.addSubcommand('add', 'points', { permLevel: 0 });
    $.addSubcommand('remove', 'points', { permLevel: 0 });
})();