module.exports = trace;
module.exports.log = log;

function trace (err) {
  if (err && err.app_stack === undefined) {
    err.app_stack = stack(arguments.callee);
  }
  return err;
};

function log (err, req, res) {
  if (err === null || err === undefined) return;

  var info = '\n\n\n';
  if (req) {
    info += req.method + ' ' + req.url + ' ' + res.statusCode + '\n';
  }

  var app_stack = err && err.app_stack;
  if (app_stack === undefined) app_stack = stack(arguments.callee);
  if (app_stack) info += app_stack + '\n';

  info += (err && err.stack || err);
  console.error(info);
};

function stack(fn) {
  var e = new Error;
  Error.captureStackTrace(e, fn);
  return e.stack;
}
