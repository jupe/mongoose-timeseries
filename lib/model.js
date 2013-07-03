/**
 *  Model capsel for mongoose-timeseries
 *
 *  Author: Jussi Vatjus-Anttila
 */

/** Module dependencies. */
var _ = require("underscore");
var mongoose = require('mongoose');

/** import schema */
var TimeSeriesSchema = require('./schema');

var TimeSeriesModel = function(collection, options){

  var model;
  var schema;

  /**
   * Methods
   */ 
  
  /**
   * Model initialization
   */
  function init(modelName, options){
    schema = new TimeSeriesSchema(options);
    
    if( mongoose.modelNames().indexOf(modelName)>=0){
      model = mongoose.model(modelName);
    }
    else {
      model = mongoose.model(collection, schema);
    }
  }
  
  /**
   * Push new value to collection
   */
  var push = function push(timestamp, value, metadata, extraCondition, cb){
    model.push(timestamp, value, metadata, extraCondition, cb);
  }
  /**
   *  Find data of given period
   */
  var findData = function (options, cb) {
    model.findData(options, cb);
  }
  /** 
   * Find Max value of given period
   */
  var findMax = function( options , cb){
    model.findMax(options, cb);
  }
  /** 
   * Find Min value of given period
   */
  var findMin = function( options , cb){
    model.findMin(options, cb);
  }
  
  var getModel = function(){
    return model;
  }
  var getSchema = function(){
    return schema;
  }
  
  init(collection, options);
  
  /* Return model api */
  return {
    getModel: getModel,
    getSchema: getSchema,
    push: push,
    findData: findData,
    findMax: findMax,
    findMin: findMin,
    model: model
  }
}

module.exports = TimeSeriesModel;
