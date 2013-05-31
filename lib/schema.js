/**
 * Module dependencies.
 */
var _ = require("underscore");
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Mixed = mongoose.Schema.Types.Mixed;

var options = {
    hourly: true,
    minute: true,
    second: true,
    millisecond: false,
    paths: {value: {type: Number}, metadata: {type: Mixed}}
  };

var roundDay = function(d){
  var t = new Date(d);
  t.setUTCHours(0);
  t.setMinutes(0);
  t.setSeconds(0);
  t.setMilliseconds(0);
  return t;
}
/**
 * Schema definition
 */
var TimeSeriesSchema = new Schema({
  metadata: {
    date: {type: Date, default: new Date},
  },
  latest: {
    value: {type: Number},
    metadata: {type: Mixed},
  },
  createdAt: {
    date: {type: Date, default: Date},
    user: {type: String}
  },
  updatedAt: {
    date: {type: Date},
    user: {type: String}
  },
});


 /** 
  * Generate time series paths 
  */
function init(schema, _options)
{
  console.log('init schema');
  options = _.extend(options, _options);
  var hourly = {};
  
  var minutes = {};
  var seconds = {};
  var milliseconds = {};
  
  var minute = {};
  var second = {};
  var millisecond = {};
  
  if( options.minute || options.second) {
    for(var i=0;i<60;i++){ 
      minutes[i] = options.paths;
    }
  }
  if( options.second ) {
    for(var i=0;i<60;i++){ 
      seconds[i] = minutes;
    }
  }
  if( options.millisecond ) {
    for(var i=0;i<1000;i++){ 
      milliseconds[i] = seconds;
    }
  }
  
  for(var i=0;i<24;i++){ 
    hourly[i] = options.paths;
    if( options.minute )
      minute[i] = minutes;
    if( options.second )
      second[i] = seconds;
    if( options.second )
      millisecond[i] = milliseconds;
  }
  schema.add({hourly: hourly});
  if( options.minute ){
    schema.add({minute: minute});
  } if( options.second ){
    schema.add({second: second});
  } if( options.millisecond ){
    schema.add({millisecond: millisecond});
  }
    
  /*TimeSeriesSchema.eachPath( function(path, spath,content){
    console.log(path);
  });*/
}
/**
 * Post hook.
 */
TimeSeriesSchema.pre('save', function (next) {
  //console.log('saving..');
  //console.log(this);
  next();
});

/**
 * Methods
 */
/*TimeSeriesSchema.summary()
{
}*/

module.exports.init = init;
module.exports.schema = TimeSeriesSchema;
module.exports.roundDay = roundDay;
module.exports.options = options;