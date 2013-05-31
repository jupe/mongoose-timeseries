var assert = require('chai').assert;
var mongoose = require('mongoose');
var mti = require('../');

mongoose.connect('mongodb://localhost/mti');

mti.init('test', {minute: true, second: true, millisecond: true}); //second: Boolean, minute: Boolean

mti.push(new Date(), i, false, {}, function(err, docs){});
var timer;
var i=0;
setTimeout( function(){
  
  timer = setInterval( function(){
    mti.push(new Date(), i+=1, false, {}, function(err, docs){
      if(err) console.log(err);
      if(docs) console.log('saved');
    });  
  }, 1000);
  
  setTimeout( function(){
    timer.stop();
  },10000);

},1000);



/*
describe('mongoose-ts', function() {
  it('init', function() {
    
    //assert.equal(error, null);
    //assert.typeOf(json, 'Array');
  });
});
*/
