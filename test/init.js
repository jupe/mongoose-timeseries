var assert = require('chai').assert;
var mongoose = require('mongoose');
var MTI = require('../');
var mti;
mongoose.connect('mongodb://localhost/mti');

mongoose.connection.on('error', function(e){
  //console.log(e);
});

describe('init -', function() {
  
  it('hour', function(done) {
    //collection
    var mti4 = new MTI('test', {interval: 3600});
    
    var schema = mti4.getSchema();
    var model = mti4.getModel();
    
    assert.typeOf( schema, 'object');
    assert.typeOf( model, 'function');
    assert.equal( model.modelName, 'test');
    assert.typeOf( schema.path('hourly.0.value'), 'object');
    assert.typeOf( schema.path('minutes.0.0.value'), 'undefined');
    assert.typeOf( schema.path('seconds'), 'undefined');
      
    done();
  });
  it('minute', function(done) {
    //collection
    var mti3 = new MTI('test', {interval: 60});
    
    var schema = mti3.getSchema();
    var model = mti3.getModel();
    
    assert.typeOf( schema, 'object');
    assert.typeOf( model, 'function');
    assert.equal( model.modelName, 'test');
    assert.typeOf( schema.path('hourly.0.value'), 'object');
    assert.typeOf( schema.path('minutes.0.0.value'), 'object');
    assert.typeOf( schema.path('seconds'), 'undefined');
      
    done();
  });
  
  it('seconds', function(done) {
    //collection
    var mti2 = new MTI('test', {interval: 1});
    
    var schema = mti2.getSchema();
    var model = mti2.getModel();
    
    assert.typeOf( schema, 'object');
    assert.typeOf( model, 'function');
    assert.equal( model.modelName, 'test');
    assert.typeOf( schema.path('hourly.0.value'), 'object');
    assert.typeOf( schema.path('minutes.0.0.value'), 'object');
    assert.typeOf( schema.path('seconds.0.0.0.value'), 'object');
      
    done();
  });
  
  /*
  it('milliseconds', function(done) {
    //collection
    var mti1 = new MTI('test', {interval: 0.1});
    
    var schema = mti1.getSchema();
    var model = mti1.getModel();
    
    //assert.typeOf( mti.push, 'function');
    //assert.typeOf( mti.findData, 'function');
    //assert.typeOf( mti.findMax, 'function');
    //assert.typeOf( mti.findMin, 'function');
    
    //model.eachPath ( function(path){
    //  console.log(path);
    //});
    assert.typeOf( schema, 'object');
    assert.typeOf( model, 'function');
    assert.equal( model.modelName, 'test');
    assert.typeOf( schema.path('hourly'), 'object');
    assert.typeOf( schema.path('minutes'), 'object');
    assert.typeOf( schema.path('seconds'), 'object');
    assert.typeOf( schema.path('milliseconds'), 'object');
      
    done();
  });
  
  */
  
});
