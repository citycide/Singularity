var Cooldown = require('./index');

var fn = Cooldown('test', 1000, function(name) {
  console.log("Hello there " + name + "!");
});

fn.on('cooldown.calledOnCooldown', function(func, args) {
  console.log("Function could not be called, it is on cooldown, sorry " + args[0]);
});

fn.on('cooldown.start', function() {
  console.log("Cooldown has been started");
});

fn.on('cooldown.end', function() {
  console.log("Cooldown has ended");
});

fn("Karl")
fn("Bryan");
