var time_format = require('../time_format.js');

var assert = require("assert");

var date = '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])';
var time = '([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)';
var date_time = date + ' ' + time;
var zone = '[+-](0\\d|1[012])([0-5]\\d)';

var date_reg = new RegExp('^' + date + '$');
var date_time_reg = new RegExp('^' + date_time + '$');
var date_time_zone_reg = new RegExp('^' + date_time + ' ' + zone + '$');


describe('time_format', function(){

  it('no params', function(){
    var s = time_format();
    assert( date_time_reg.test(s) );
  });

  it('only time param', function(){
    var s = time_format(new Date());
    assert( date_time_reg.test(s) );
  });

  it('time option', function() {
    var s = time_format({ time: false });
    assert( date_reg.test(s) );
  });

  it('zone option', function(){
    var s = time_format({ zone: true });
    assert( date_time_zone_reg.test(s) );
  });

  it('time and zone option', function(){
    var s = time_format(new Date(), { zone: true });
    assert( date_time_zone_reg.test(s) );
  });


  it('specify time', function(){
    var cases = [
      '2015-01-01 01:01:01',
      '2015-01-01 11:11:11',
      '2015-11-11 11:11:11'
    ];
    cases.forEach(function(value){
      assert.equal(time_format(new Date(value)), value);
    });
  });
});
