var assert = require('chai').assert;
var mongoose = require('mongoose');
var MTI = require('../');

mongoose.connect('mongodb://localhost/mti');
//mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
//mongoose.connection.on('open', console.log.bind(console, 'connection:'));

describe('init -', function() {
  before( function(done){
    done();
  });
  it('hour', function(done) {
    //collection
    var mti4 = new MTI('mti4', {interval: 3600});
    
    var schema = mti4.getSchema();
    var model = mti4.getModel();
    assert.typeOf( schema, 'object');
    assert.typeOf( model, 'function');
    assert.equal( model.modelName, 'mti4');
    assert.typeOf( schema.path('hourly'), 'object');
    assert.typeOf( schema.path('minutes'), 'undefined');
    assert.typeOf( schema.path('seconds'), 'undefined');
    assert.typeOf( schema.path('milliseconds'), 'undefined');
      
    done();
  });
  
  it('minute', function(done) {
    //collection
    var mti3 = new MTI('mti3', {interval: 60});
    
    var schema = mti3.getSchema();
    var model = mti3.getModel();
    
    assert.typeOf( schema, 'object');
    assert.typeOf( model, 'function');
    assert.equal( model.modelName, 'mti3');
    assert.typeOf( schema.path('hourly'), 'object');
    assert.typeOf( schema.path('minutes'), 'object');
    assert.typeOf( schema.path('seconds'), 'undefined');
    assert.typeOf( schema.path('milliseconds'), 'undefined');
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
    assert.typeOf( schema.path('hourly'), 'object');
    assert.typeOf( schema.path('minutes'), 'object');
    assert.typeOf( schema.path('seconds'), 'object');
    assert.typeOf( schema.path('milliseconds'), 'undefined');
      
    done();
  });
  
  /*
  it('milliseconds', function(done) {
    //collection
    var mti1 = new MTI('test', {interval: 0.1});
    
    var schema = mti1.getSchema();
    var model = mti1.getModel();
    
    assert.typeOf( schema, 'object');
    assert.typeOf( model, 'function');
    assert.equal( model.modelName, 'test');
    assert.typeOf( schema.path('hourly'), 'object');
    assert.typeOf( schema.path('minutes'), 'object');
    assert.typeOf( schema.path('seconds'), 'object');
    assert.typeOf( schema.path('milliseconds'), 'object');
    assert.typeOf( schema.path('milliseconds'), 'object');
    done();
  });*/
});
