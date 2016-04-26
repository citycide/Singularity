var test = require('tap').test
var Cooldown = require('../')

test('create a cooldown function that will not fire when on cooldown', function(t) {
  var count = 0
  var fn = new Cooldown(200, function() {
    count += 1
  })

  fn()
  fn()
  fn()

  t.equal(count, 1, 'function should be fired once')

  setTimeout(function() {
    fn()
    t.equal(count, 2, 'function should be off cooldown')
    t.end()
  }, 200)
})

test('fires event when cooldown starts', function(t) {
  var fn = Cooldown(100, function() {})

  fn.on('cooldown.start', function() {
    t.ok(fn);
    t.end();
  });

  fn()
})

test('fires event when cooldown end', function(t) {
  var fn = Cooldown(100, function() {})

  fn.on('cooldown.end', function() {
    t.ok(fn);
    t.end();
  });

  fn()
})

test('fires event when fn is called while on cooldown', function(t) {
  var fn = Cooldown(100, function() {})

  fn.on('cooldown.calledOnCooldown', function() {
    t.ok(fn);
    t.end();
  });

  fn()
  fn()
})
