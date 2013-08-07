var assert = require('chai').assert;
var mongoose = require('mongoose');
var MTI = require('../');
var mti;
mongoose.connect('mongodb://localhost/mti');

mongoose.connection.on('error', function(e){
  //console.log(e);
});

describe('hours push -', function() {
  
  before(function(){
    mti = new MTI('test', {interval: 3600, postProcessImmediately: true});
    mti.model.remove({}, function(){});
  });
  
  it('init', function(done) {
    mti.model.count({}, function(e,c){
      assert.typeOf(e, 'null');
      assert.equal(c, 0);
      done();
    });
    
  });
  
  it('pushes', function(done) {
    var loop = function(count, i, cb){
      if(i<count) {
        
        mti.push( new Date(2013,6,16, i), 
                    i, 
                    {test: i}, 
                    false,
                    function(error, doc){
          //console.log('Hour: '+i);
          //console.log(Object.keys(doc.hourly));
          assert.typeOf(error, 'null');
          assert.typeOf(doc, 'object');
          assert.equal(doc.actor, 0, 'actor');
          assert.equal(doc.day.getTime(), new Date(2013,6,16).getTime());
          assert.equal(doc.latest.value, i, 'Latest');
          assert.equal(doc.hourly[i].value, i, 'current');
          assert.equal(doc.hourly[i].metadata.test, i, 'metadata');
          
          //assert.equal( Object.keys(doc.hourly).length, i+1);
          
          //console.log('Loop '+i+' OK.');
          loop(count, i+1, cb);
        });
      } else {
        cb();
      }
    }
    loop(10, 0, function(){
      done();
    });
  });
  
  it('doc count', function(done) {
    //collection
    mti.model.find({}, function(e,docs){
      assert.typeOf(e, 'null');
      assert.typeOf(docs, 'array');
      assert.equal(docs.length, 1);
      //console.log('stats: '+JSON.stringify(docs[0].statistics));
      assert.equal(docs[0].statistics.i, 10);
      assert.equal(docs[0].statistics.min.value, 0);
      assert.equal(docs[0].statistics.max.value, 9);
      assert.equal(docs[0].statistics.avg, 4.5);
      done();
    });
  });
  
  it('findMin', function(done) {
    //collection
    mti.findMin( {from: new Date(2013,6,16),
                  to: new Date(2013,6,16)
                 }, function(e,min){
      assert.typeOf(e, 'null');
      assert.equal(min.value, 0);
      done();
    })
  });
  
  it('findMax', function(done) {
    //collection
    mti.findMax( {from: new Date(2013,6,16),
                  to: new Date(2013,6,16)
                 }, function(e,max){
      assert.typeOf(e, 'null');
      assert.equal(max.value, 9);
      done();
    })
  });
});
