
module.exports = time_format;

/*
 * @param {Date}   time 日期对象
 * @param {Object} options 选项
 * @param {Bool}   options.date 是否包含日期，默认值为 true
 * @param {Bool}   options.time 是否包含时间，默认值为 true
 * @param {Bool}   options.zone 是否包含时区，默认值为 false
 *
 * @return {String} 格式如 '2015-11-13 21:45:48 +0800'
 */

function time_format(time, options) {
  if (!(time instanceof Date) && (time instanceof Object)) {
    options = time;
    time = null;
  }
  if (!time) time = new Date();

  var s = [ ];
  if (!options || options.date || options.date === undefined)
    s.push(get_date(time));
  if (!options || options.time || options.time === undefined)
    s.push(get_time(time));
  if (options && options.zone) s.push(get_zone(time));

  return s.join(' ');
}

function get_date(time) {
  var year   = time.getFullYear();
  var month  = time.getMonth() + 1;
  var date   = time.getDate();
  return year + '-' + pad2(month) + '-' + pad2(date);
}

function get_time(time) {
  var hour   = time.getHours();
  var minute = time.getMinutes();
  var second = time.getSeconds();
  return pad2(hour) + ':' + pad2(minute) + ':' + pad2(second);
}

function get_zone(time) {
  var offset = time.getTimezoneOffset();
  var abs = Math.abs(offset);
  var h = Math.floor(abs / 60);
  var m = abs % 60;
  return (offset > 0 ? '-' : '+') + pad2(h) + pad2(m);
}

function pad2(num) {
  var str = String(num);
  return (str.length === 1 ? '0' : '') + str;
}

