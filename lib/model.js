var async = require('async');
var _ = require("underscore");
var mongoose = require('mongoose');
var TimeSeriesSchema = require('./schema');
var model;

var summaryFunc = function(task, cb){
  console.log('working background..');
  var timestamp = task.timestamp;
  var condition = task.condition;
  var value = task.value;
  
  //calculate parallel averages
  model.findOne( condition, function(error, doc){
    var json = doc.toObject();
    var updates = {}
    //console.log('value: '+value);
  
    var sum=0, i=0;
    if( TimeSeriesSchema.options.millisecond && json.millisecond) {
      sum = 0;i=0
      for(var hour in json.millisecond){
        for(var min in json.millisecond[hour]){
          for(var sec in json.millisecond[hour][min]){
            for(var sec in json.millisecond[hour][min]){
              sum += json.millisecond[hour][min][sec].value;
              i++;
            }
          }
        }
      }
      //console.log('millisecond avg: '+(sum/i)+', i: '+i+' sum: '+sum);
      updates['second.'+timestamp.getHours() +'.'+timestamp.getMinutes()+'.value'] = sum/i;
    } if( TimeSeriesSchema.options.second && json.second) {
      sum = 0;
      i=0;
      for(var hour in json.second){
        for(var min in json.second[hour]){
          for(var sec in json.second[hour][min]){
            sum += json.second[hour][min][sec].value;
            i++;
          }
        }
      }
      //console.log('minute avg: '+(sum/i)+', i: '+i+' sum: '+sum);
      updates['minute.'+timestamp.getHours() +'.'+ timestamp.getMinutes()+'.value'] = sum/i;
    } if( TimeSeriesSchema.options.minute && json.minute) {
      sum = 0;
      i=0;
      for(var hour in json.minute){
        for(var min in json.minute[hour]){
          //console.log(json.minute[hour][min]);
          sum += json.minute[hour][min].value;
          i++;
        }
      }
      //console.log('hour avg: '+(sum/i)+', i: '+i+' sum: '+sum);
      updates['hourly.'+ timestamp.getHours() +'.value'] = sum/i;
    } 
    console.log(updates);
    doc.set(updates);
    doc.save(cb);
  });
}

var q = async.queue(summaryFunc, 10);

function init(collection, options){
  TimeSeriesSchema.init(TimeSeriesSchema.schema, options);
  model = mongoose.model(collection, TimeSeriesSchema.schema);
  if( options.drain ) {
    q.drain = options.drain;
  }
}
function getUpdates(timestamp, value, metadata){
  
  var updates = {}
  if( TimeSeriesSchema.options.millisecond ) {
    updates['millisecond.'+timestamp.getHours()+'.'+timestamp.getMinutes()+'.'+timestamp.getSeconds()+'.'+timestamp.getMilliSeconds()+'.value']=value;
    if( metadata ) updates['millisecond.'+timestamp.getHours() +'.'+ timestamp.getMinutes() +'.'+ timestamp.getSeconds() +'.'+ timestamp.getMilliSeconds()+'.metadata']=metadata;
  } else if( TimeSeriesSchema.options.second ) {
    updates['second.'+timestamp.getHours() +'.'+ timestamp.getMinutes() +'.'+ timestamp.getSeconds()+'.value']=value;
    if( metadata ) updates['second.'+ timestamp.getHours() +'.'+ timestamp.getMinutes() +'.'+ timestamp.getSeconds() +'.metadata']=metadata;
  } else if( TimeSeriesSchema.options.minute ){
    updates['minute.'+timestamp.getHours() +'.'+ timestamp.getMinutes()+'.value']=value;
    if( metadata ) updates['minute.'+ timestamp.getHours() +'.'+ timestamp.getMinutes() +'.metadata']=metadata;
  } else if( TimeSeriesSchema.options.hourly ) { 
    updates['hourly.'+timestamp.getHours()+'.value']=value;
    if( metadata ) updates['hourly.'+timestamp.getHours()+'.metadata']=metadata;
  }
  updates['updatedAt.date'] = new Date();
  updates['latest.value'] = value;
  if( metadata )updates['latest.metadata'] = metadata;
  return updates;
}
function push(timestamp, value, metadata, extraCondition, cb)
{
  var day = TimeSeriesSchema.roundDay(timestamp);
  var condition = {'metadata.date': day};
  _.extend(condition, extraCondition);
  var updates = getUpdates(timestamp, value, metadata);
  //console.log(updates);
  
  model.update( condition, updates, function(error, ok){  
    if( error) {
      console.log(error);
      cb(error);
    } else if( ok ) {
      cb(null, ok);
      q.push( {condition: condition, value: value, timestamp: timestamp}, function() {
      });
    } else {
      //console.log('Create new');
      var doc = new model(  { 'metadata.date': day} );
      var updates = getUpdates(timestamp, value, metadata);
      doc.set(updates);
      doc.updatedAt.date = new Date();
      doc.save(cb);
    }
  });
}
module.exports.init = init;
module.exports.model = model;
module.exports.push = push;
//module.exports.addMeta = addMeta;