# On Cooldown [![Build Status](https://travis-ci.org/karlbright/on-cooldown.svg?branch=master)](https://travis-ci.org/karlbright/on-cooldown)

> Simple library for creating functions with cooldowns

## Example


### Basic
```javascript
var cooldown = require('on-cooldown');

var fn = cooldown(1000, function(name) {
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
```

### Basic Bot
```javascript
var cooldown = require('on-cooldown');

robot.respond(/gems$/i, cooldown(300000, function(msg) {
  // This message will only be send when called, once every 5 minutes
  msg.send('Hello world');
});
```

