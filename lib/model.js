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

var TimeSeriesModel = function(){

  var model;

  /**
   * Methods
   */ 
  
  /**
   * Model initialization
   */
  function init(collection, options){
    TimeSeriesSchema.init(TimeSeriesSchema.schema, options);
    model = mongoose.model(collection, TimeSeriesSchema.schema);
    if( options.drain ) {
      q.drain = options.drain;
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
  
  /* Return model api */
  return {
    init: init,
    model: model,
    push: push,
    findData: findData,
    findMax: findMax,
    findMin: findMin,
    model: model      //for normal model operations
  }
}

module.exports = TimeSeriesModel();
