var assert = require('chai').assert;
var mongoose = require('mongoose');
var MTI = require('../');
var mti;
mongoose.connect('mongodb://localhost/mti');

mongoose.connection.on('error', function(e){
  console.log(e);
});

describe('minutes -', function() {
  
  it('init', function(done) {
    mti = new MTI('test', {interval: 60});
    
    var schema = mti.getSchema();
    var model = mti.getModel();
    
    assert.typeOf( schema, 'object');
    assert.typeOf( model, 'function');
    assert.equal( model.modelName, 'test');
    assert.typeOf( schema.path('hourly.0.value'), 'object');
    assert.typeOf( schema.path('minutes.0.0.value'), 'object');
    assert.typeOf( schema.path('seconds.0.0.0.value'), 'undefined');
    
    mti.model.remove({}, function(){
      mti.model.count({}, function(e,c){
        assert.typeOf(e, 'null');
        assert.equal(c, 0);
        done();
      });
    });
  });
  it('pushes', function(done) {
    this.timeout(60000);
    var loop = function(count, i, cb){
      if(i<count) {
        var hour = 12+Math.floor(i/60);
        var min = i%60;
        mti.push( new Date(2013,6,16, hour, min), 
                    i, 
                    {test: i}, 
                    false,
                    function(error, doc){
          //console.log('Hour: '+i);
          //console.log(doc);
          assert.typeOf(error, 'null');
          assert.typeOf(doc, 'object');
          assert.equal(doc.actor, 0, 'actor');
          assert.typeOf(doc.minutes, 'object');
          assert.equal(doc.day.getTime(), new Date(2013,6,16).getTime());
          assert.equal(doc.latest.value, i, 'Latest');
          
          assert.equal(doc.minutes[hour][min].value, i, 'current');
          assert.equal(doc.minutes[hour][min].metadata.test, i, 'metadata');
          
          //assert.equal( Object.keys(doc.hourly).length, i+1, 'hourly length');
          
          //console.log('Loop '+i+' OK.');
          loop(count, i+1, cb);
        });
      } else {
        cb();
      }
    }
    loop(360, 0, function(){ //every minute between 1...360
      done();
    });
  });
  
  it('doc post process', function(done){
    mti.model.recalc(new Date(2013,6,16) );
    done();
  });
  
  it('doc summary', function(done) {
    //collection
    mti.model.find({}, function(e,docs){
      assert.typeOf(e, 'null');
      assert.typeOf(docs, 'array');
      assert.equal(docs.length, 1);
      //console.log('stats: '+JSON.stringify(docs[0].statistics));
      assert.equal(docs[0].statistics.i, 360);
      assert.equal(docs[0].statistics.min.value, 0);
      assert.equal(docs[0].statistics.max.value, 359);
      assert.equal(docs[0].statistics.avg, 179.5);
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
      assert.equal(max.value, 359);
      done();
    })
  });
});
