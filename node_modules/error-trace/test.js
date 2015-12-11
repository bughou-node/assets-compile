var trace = require('./error-trace.js');
var log_error = trace.log;

function async_fun(callback) {
  process.nextTick(function error_at() {
    callback(new Error('xxxxx'));
  });
}

async_fun(function error_from (error) {
  // console.error(error.stack);
  trace(error);
  log_error(error);
  console.log('\nok');
});

