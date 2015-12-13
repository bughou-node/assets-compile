#!/usr/bin/env node

var uglifyjs = require('uglify-js');
var CleanCSS = require('clean-css');
var cleancss = new CleanCSS();

var async = require('async');
var fs = require('fs');
var p = require('path');
var crypto = require('crypto');
var time_format = require('time_format');

var trace = require('error-trace');
var log_error = trace.log;

var assets_json = require(p.join(process.cwd(), './assets.json'));

async.forEachOfSeries(assets_json, function (meta, path, callback) {
  if (!/\.(js|css)$/.test(path)) return callback();

  if_modified(path, meta, function() {
    minify_asset(path, meta, callback);
  }, callback);
}, function(err) {
  if (err) return log_error(err);
  fs.writeFile(
    './assets.json', JSON.stringify(assets_json, null, 2),
    function(err) {
      if (err) log_error(err);
    });
});

// callback()
// callback2(err)
function if_modified(path, meta, callback, callback2) {
  if (!meta || !meta.mtime) return callback();

  fs.stat(get_input_path(path), function(err, stats) {
    if (err) return callback2(trace(err));

    if (stats.mtime > new Date(meta.mtime)) {
      callback();
    } else {
      callback2();
    }
  });
}

// callback(err)
function minify_asset(path, meta, callback) {
  minify(path, function(err, result){
    if (err) return callback(trace(err));
    var md5 = crypto.createHash('md5').update(result).digest('hex');

    meta.mtime = time_format({ zone: true })
    if (md5 === meta.md5) return callback();
    meta.md5 = md5;

    save_asset_file(path, result, callback);
  });
}

function minify(path, callback) {
  switch(p.extname(path)) {
    case '.js':
      return minify_js(path, callback);
      break;
    case '.css':
      return minify_css(path, callback);
    default:
      throw 'unknown ext for: ' + path;
  }
}

function minify_js(path, callback) {
  var result = uglifyjs.minify(get_input_path(path));
  callback(null, result.code);
}

function minify_css(path, callback) {
  var content = fs.readFileSync(get_input_path(path));
  var result = cleancss.minify(content);
  callback(null, result.styles);
}

function save_asset_file(path, result, callback) {
  var output_path = get_output_path(path);
  console.log(output_path);
  fs.writeFile(output_path, result, function(err) {
    if (err) callback(trace(err));
    else callback();
  });
}


function get_input_path(path) {
  return p.join('public', path);
}

function get_output_path(path) {
  var dir = p.dirname(path);
  var ext = p.extname(path);
  var name = p.basename(path, ext);
  return p.join(
    'public', dir, name + '.min' + ext
  );
}

