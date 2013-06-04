var assert = require('chai').assert;
var mongoose = require('mongoose');
var mti = require('../');

mongoose.connect('mongodb://localhost/mti');

mti.init('test', {interval: 1}); //second: Boolean, minute: Boolean


var i=0;


mti.push(new Date(), i, false, {}, function(err, docs){});
var timer;

setTimeout( function(){
  
  timer = setInterval( function(){
    mti.push(new Date(), i+=1, false, {}, function(err, docs){
      if(err) {
        console.log(err);
      }
      //if(docs) console.log('saved');
    });  
  }, 1000);
  
  setTimeout( function(){
    console.log('stop looping');
    timer.stop();
  },5000);
},1000);



//var format = 'hash'
var format = '[x,y]'
//var format = '[ms,y]'
mti.findData( {
    from: new Date(new Date()-1000*60*60*24*2), to: new Date(), 
    condition: {}, 
    interval: 60, 
    format: format}, 
    function(error, data){
  if(error)console.log(error);
  else console.log('len: '+data.length);
});

mti.findMin( {
    from: new Date(new Date()-1000*60*60*24), to: new Date(), 
    condition: {}, 
    interval: 60, 
    format: format}, 
    function(error, data){
  if(error)console.log(error);
  else console.log('min: '+data);
});
mti.findMax( {
    from: new Date(new Date()-1000*60*60*24), to: new Date(), 
    condition: {}, 
    interval: 60, 
    format: format}, 
    function(error, data){
  if(error)console.log(error);
  else console.log('max: '+data);
});
/*
describe('mongoose-ts', function() {
  it('init', function() {
    
    //assert.equal(error, null);
    //assert.typeOf(json, 'Array');
  });
});
*/
