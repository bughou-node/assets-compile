#!/usr/bin/env node

var browserify = require('browserify');
var exorcist = require('exorcist');
var less = require('less');

var async = require('async');
var colors = require('colors');
var mkdirp = require('mkdirp');
var time_format = require('time_format');

var p = require('path');
var fs = require('fs');

var dir = process.cwd();
var assets_json, defaults;
var defaults_config = {
  options: {
    debug: true,
    noParse: [ "jquery" ]
  },
  external: "jquery"
};

(function() {
  if (process.argv.length < 3) {
    var cmd = p.relative(process.cwd(), process.argv[1]);
    cmd = p.dirname(cmd) + '/' + p.basename(cmd);
    console.error('usage: %s <path to .js or .less file> ...'.red, cmd);
    return;
  }
  read_assets_json(function (write_defaults) {
    async.map(process.argv.slice(2), function(file_path, callback) {
      watch_asset(get_asset_path(file_path), callback);
    }, function(err, changed) {
      if (write_defaults ||changed.indexOf(true) >= 0) save_assets_json();
    });
  });
})();

function read_assets_json(callback) {
  var path = p.join(dir, './assets.json')
  fs.exists(path, function (exists) {
    assets_json = exists ? require(path) : { };
    if (!assets_json.defaults) {
      var write_defaults = true;
      assets_json.defaults = defaults_config;
    }
    defaults = assets_json.defaults;
    callback(write_defaults);
  });
}


function watch_asset(asset_path, callback) {
  var ext = p.extname(asset_path);
  if (ext === '.js' || ext === '.less') {
    add_to_assets_json(asset_path, function(changed) {
      ext === '.js' ? watch_js(asset_path) : watch_less(asset_path);
      callback(null, changed);
    });
  } else {
    console.error('unknown ext %s for: %s '.red, ext, asset_path);
    callback();
  }
}


function add_to_assets_json(asset_path, callback) {
  var new_asset_path = asset_path.replace(/\.less$/, '.css');
  if (assets_json[new_asset_path]) return callback();
  fs.exists(asset_path, function(exists) {
    if (!exists || assets_json[new_asset_path]) return callback();
    assets_json[new_asset_path] = { };
    callback(true);
  });
}

function save_assets_json() {
  fs.writeFile(
    './assets.json', JSON.stringify(assets_json, null, 2),
    function(err) {
      if (err) console.error(err.stack);
    }
  );
}

function watch_js(asset_path) {
  compile_js(asset_path, function(requires) {
    watch_files(requires, function() {
      watch_js(asset_path);
    });
  });
}

function watch_less(asset_path) {
  compile_less(asset_path, function(imports) {
    if (!imports) imports = [ ];
    imports.push(asset_path);
    watch_files(imports, function() {
      watch_less(asset_path);
    });
  });
}

function compile_js(asset_path, callback) {
  var start_time = new Date();
  var requires = [ ];
  var length = 0;

  get_output_path(asset_path, function(output_path) {
    browserify_js(asset_path).on('file', function(file, id, parent) {
      requires.push(file);
    }).bundle().pipe(exorcist(
      output_path + '.map', p.basename(asset_path) + '.map'
    )).on('data', function(chunk) {
      length += chunk.length;
    }).on('end', function() {
      console.log(
        '%s %d bytes written to %s (%d seconds)',
        time_format().green, length, output_path,
        ((new Date() - start_time) / 1000).toFixed(2)
      );
      callback(requires);
    }).pipe(fs.createWriteStream(output_path));
  });
}

function browserify_js(asset_path) {
  var b = browserify(asset_path, defaults.options);
  var config = assets_json[asset_path];

  if (config && config.hasOwnProperty('require')) {
    if (config.require) b = b.require(config.require);
  } else {
    if (defaults.require) b = b.require(defaults.require);
  }

  if (config && config.hasOwnProperty('external')) {
    if (config.external) b = b.external(config.external);
  } else {
    if (defaults.external) b = b.external(defaults.external);
  }

  return b;
}

function compile_less(asset_path, callback) {
  var start_time = new Date();
  var css_path = asset_path.replace(/\.less$/, '.css');
  less.render(
    fs.readFileSync(asset_path, { encoding: 'utf8' }), {
      filename: asset_path,
      sourceMap: {
        sourceMapURL: p.basename(css_path) + '.map'
      }
    }, function(err, output) {
      try {
        if (err) {
          console.error((err.message || err.toString()).red);
          return callback();
        }
        write_less_output(css_path, output, start_time, callback);
      } catch (e) {
        console.error(e.stack.red);
      }
    });
}

function write_less_output(asset_path, output, start_time, callback) {
  get_output_path(asset_path, function(output_path) {
    fs.writeFileSync(output_path, output.css);
    fs.writeFileSync(output_path + '.map', output.map);

    console.log(
      '%s %d bytes written to %s (%d seconds)',
      time_format().cyan, output.css.length, output_path,
      ((new Date() - start_time) / 1000).toFixed(2)
    );
    return callback(output.imports);
  });
}

function watch_files(files, callback) {
  var watchers = [ ];
  for (var i = 0, file; file = files[i]; i++) {
    watchers.push(fs.watch(file, function(event, filename) {
      if (process.env.DEBUG) {
        console.log(arguments);
      }
      if (event !== 'change') return;
      watchers.forEach(function(watcher) {
        watcher.close();
      });
      callback();
    }));
  }
}

function get_asset_path(file_path) {
  if (! p.isAbsolute(file_path)) {
    file_path = p.join(dir, file_path);
  }
  return p.relative(dir, file_path);
}

function get_output_path(asset_path, callback) {
  var output_path = p.join('public', asset_path);
  mkdirp(p.dirname(output_path), function(err) {
    if (err) {
      return console.error(err);
    }
    callback(output_path);
  });
}
