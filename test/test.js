var assert = require('assert');
var spawn = require('child_process').spawnSync;

var p = require('path');

process.chdir(__dirname);

describe('assets_watch', function () {
  it('should work', function () {
    var result = spawn('');

    assert(html.indexOf('src="/js/chat.js"') > 0);
  });
});

describe('assets_minify', function () {
  it('should work', function () {
    var html = assets.js_tag('chat.js');
    assert(html.indexOf('src="/js/chat.js"') > 0);
  });
});
