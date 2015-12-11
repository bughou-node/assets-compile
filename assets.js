var _path = require('path');

var production = require('../../common/config/env.js').is_production;
if (production) {
  var assets = require('../assets.json');
  var log_error = require('../../common/utils/track_error.js').log_error;
}

exports.js_tag = function(path) {
  path = _path.join('js', path);
  if (production) path = production_path(path);
  path = _path.join('/static', path);
  return '\n  <script type="text/javascript" src="' + path + '"></script>';
};

exports.css_tag = function(path) {
  path = _path.join('css', path);
  if (production) path = production_path(path);
  path = _path.join('/static', path);
  return '\n  <link rel="stylesheet" type="text/css" href="' + path + '">';
};


function production_path(path) {
  var md5 = assets[path] && assets[path].md5;
  md5 || log_error('can not get asset md5 for: ' + path);

  var dir  = _path.dirname(path);
  var ext  = _path.extname(path);
  var name = _path.basename(path, ext);

  return _path.join(dir, name + '.min' + ext) + '?' + md5;
}

