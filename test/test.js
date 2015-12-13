var cp = require('child_process');
var fs = require('fs');

var assert = require('assert');

var p = require('path');

process.chdir(__dirname);

describe('assets_watch', function () {
  it('should work', function (done) {
    cp.execFileSync('rm', [ '-rf', 'assets.json', 'public' ]);

    var child = cp.spawn('../assets_watch.js', [ 'js/chat.js', 'css/chat.less' ], {
      stdio: [ 0, 'pipe', 2 ]
    });

    var lines = 0;
    child.stdout.on('data', function (s) {
      s = s.toString();
      lines += (s.match(/\n/g) || [ ]).length;
      if (lines === 2) {
        [ 'assets.json', 
          'public/js/chat.js', 'public/js/chat.js.map',
          'public/css/chat.css', 'public/css/chat.css.map',
        ].forEach(function (path) {
          assert(fs.existsSync(path));
        });
        var t = Math.ceil(Date.now() / 1000);
        fs.utimesSync('js/chat.js', t, t);
      } else if (lines === 3) {
        var t = Math.ceil(Date.now() / 1000);
        fs.utimesSync('css/chat.less', t, t);
      } else if (lines === 4) {
        child.on('close', function() {
          done();
        });
        child.kill();
      }
    });
  });
});

describe('assets_minify', function () {
  it('should work', function () {
    cp.execFileSync('rm', [
      '-f', 'public/js/chat.min.js', 'public/css/chat.min.css'
    ]);

    var output = cp.execFileSync('../assets_minify.js').toString();

    assert(output === 'public/js/chat.min.js\npublic/css/chat.min.css\n');
  });
});
