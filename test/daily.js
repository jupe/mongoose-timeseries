var assert = require('chai').assert;
var mongoose = require('mongoose');
var MTI = require('../');
var mti;

//mongoose.connect('mongodb://localhost/mti');
//mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

describe('daily -', function() {
  
  before(function(done){
    
    mti = new MTI('daily', {interval: 86400/* 24h */, postProcessImmediately: true});
    mti.model.remove({}, function(){
      done();
    });
  });
  
  it('init', function(done) {
    mti.model.count({}, function(e,c){
      assert.typeOf(e, 'null');
      assert.equal(c, 0);
      done();
    });
  });
  
  it('pushes', function(done) {
    var loop = function( i, count,  cb){
      if(i<count) {
        
        mti.push( new Date(2013,6,i, 0), 
                    i, 
                    {test: i}, 
                    false,
                    function(error, doc){
          //console.log('Hour: '+i);
          //console.log(Object.keys(doc.hourly));
          assert.typeOf(error, 'null');
          assert.typeOf(doc, 'object');
          assert.equal(doc.actor, 0, 'actor');
          assert.equal(doc.day.getTime(), new Date(2013,6,i).getTime());
          assert.equal(doc.latest.value, i, 'Latest');
          assert.equal(doc.daily.value, i, 'current');
          assert.equal(doc.daily.metadata.test, i, 'metadata');
          
          //console.log('Loop '+i+' OK.');
          loop(i+1, count, cb);
        });
      } else {
        cb();
      }
    }
    loop(1, 11, function(){
      done();
    });
  });
  
  it('doc count', function(done) {
    //collection
    mti.model.find({}, function(e,docs){
      assert.typeOf(e, 'null');
      assert.typeOf(docs, 'array');
      assert.equal(docs.length, 10);
      //console.log('stats: '+JSON.stringify(docs[0].statistics));
      var i;
      for(i=0;i<10;i++){
        assert.equal(docs[i].statistics.i, 1);
        assert.equal(docs[i].statistics.min.value, i+1);
        assert.equal(docs[i].statistics.max.value, i+1);
        assert.equal(docs[i].statistics.avg, i+1);
      }
      done();
    });
  });
  
  it('findMin', function(done) {
    //collection
    mti.findMin( {from: new Date(2013,6,0),
                  to: new Date(2013,6,16)
                 }, function(e,min){
      assert.typeOf(e, 'null');
      assert.equal(min.value, 1);
      done();
    })
  });
  
  it('findMax', function(done) {
    //collection
    mti.findMax( {from: new Date(2013,6,0),
                  to: new Date(2013,6,16)
                 }, function(e,max){
      assert.typeOf(e, 'null');
      assert.equal(max.value, 10);
      done();
    })
  });
});
describe('daily fetch', function() {
  //var format = 'hash'
  //var format = '[x,y]'
  //var format = '[ms,y]'
  
  it('getData - format[x,y]', function(done){
    mti.findData({from: new Date(2013,5,30),
                  to: new Date(2013,6,10),
                  condition: {},
                  format: '[x,y]'
                 }, function(e,data){
      //console.log(data);
      assert.typeOf(e, 'null');
      assert.typeOf(data, 'array');
      assert.equal(data.length, 10);
      var i=1;
      data.forEach( function(row){
        assert.typeOf(row, 'array');
        assert.equal(row.length, 2);
        assert.equal(row[1], i++);
        assert.typeOf(row[0], 'Date');
        assert.typeOf(row[1], 'number');
      });
      done();
    });
  });
  
  it('getData (half period)-format[x,y]', function(done){
    mti.findData({from: new Date(2013,6,2),
                  to: new Date(2013,6,4),
                  condition: {},
                  format: '[x,y]'
                 }, function(e,data){
      assert.typeOf(e, 'null');
      assert.typeOf(data, 'array');
      assert.equal(data.length, 3);
      var i=2;
      data.forEach( function(row){
        assert.typeOf(row, 'array');
        assert.equal(row.length, 2);
        assert.equal(row[1], i++);
        assert.typeOf(row[0], 'Date');
        assert.typeOf(row[1], 'number');
      });
      done();
    });
  });
  
  it('getData-format[ms,y]', function(done){
    mti.findData({from: new Date(2013,6,1),
                  to: new Date(2013,6,6),
                  condition: {},
                  format: '[ms,y]'
                 }, function(e,data){
      //console.log(data);
      assert.typeOf(e, 'null');
      assert.typeOf(data, 'array');
      assert.equal(data.length, 6);
      var i=1;
      data.forEach( function(row){
        assert.typeOf(row, 'array');
        assert.equal(row.length, 2);
        assert.equal(row[1], i++);
        assert.typeOf(row[0], 'number');
      });
      done();
    });
  });
});
