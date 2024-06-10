var jscheck = require('../../lib/jscheck');
var assert = require('assert');

describe('jscheck', function() {
  it('can be seeded with a random number generator', function() {
    var next, gen;
    var nextRandomNumber = 1;
    var n = 10;

    var jsc = jscheck.configure({
      random: function() {
        return nextRandomNumber++;
      }
    });

    while(n--) {
      next = 10 * nextRandomNumber + 1;
      gen = jsc.integer(10);
      if (typeof gen === 'function') {
        assert.equal(gen(), next);
      } else {
        assert.equal(gen, next);
      }
    }
  });
});
