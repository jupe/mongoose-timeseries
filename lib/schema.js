/**
 * Module dependencies.
 */
var _ = require("underscore");
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Mixed = mongoose.Schema.Types.Mixed;

/*
  allowed interval values (seconds): 
  0.001, 0.002, 0.005, 0.01, 0,02, 0,05, 0.1, 0.2, 0.5,       //milliseconds
  1, 2, 5, 10, 30,  60,                                       //seconds
  120 (2min), 300 (5min), 600 (10min), 1800(30min), 3600(1h)  //minutes
*/
var options = {
    interval: 60,  // seconds
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
    interval: {type: Number},
  },
  latest: {
    value: {type: Number, default: 0},
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
  statistics: {
    i: {type: Number, default: 0},
    avg: {type: Number, default: 0},
    max: {type: Number},
    min: {type: Number},
  }
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
  
  if( options.interval < 3600 ) {
    console.log('minutes..');
    for(var i=0;i<60;i+=1){ 
      minutes[i] = options.paths;
    }
  }
  if( options.interval < 60 ) {
    console.log('seconds..');
    for(var i=0;i<60;i+=1){ 
      seconds[i] = minutes;
    }
  }
  if( options.interval < 1 ) {
    console.log('milliseconds..');
    for(var i=0;i<1000;i+=1){ 
      milliseconds[i] = seconds;
    }
  }
  
  for(var i=0;i<24;i++){ 
    hourly[i] = options.paths;
    if( options.interval < 3600 )
      minute[i] = minutes;
    if( options.interval < 60 )
      second[i] = seconds;
    if( options.interval < 1 )
      millisecond[i] = milliseconds;
  }
  schema.add({hourly: hourly});
  if( options.interval < 3600 ){
    schema.add({minute: minute});
  } if( options.interval < 60 ){
    schema.add({second: second});
  } if( options.interval < 1 ){
    schema.add({millisecond: millisecond});
  }
    
  var paths = []
  TimeSeriesSchema.eachPath( function(path, spath,content){
    //console.log(path);
    paths.push(path);
  });
  require('fs').writeFile('paths.json', JSON.stringify(paths, null, 4), function(err){});
}
/**
 * Post hook.
 */
TimeSeriesSchema.pre('save', function (next) {
  //console.log('saving..');
  //console.log(this);
  this.metadata.interval = options.interval;
  this.statistics.avg = this.latest.value;
  next();
});

/**
 * Methods
 */
TimeSeriesSchema.static('getData', function (interval) {
  
});
var dataFormat = function(timestamp, value, format, ext){
  switch(format){
    case('[ms,y]'): return [ timestamp.getTime(), value ]
    case('[x,y]'): return [ timestamp, value ]
    default: 
    case('hash'): return _.extend({ timestamp: timestamp, value: value }, ext);
    
  }
}
/**
 * Virtual methods
 */
TimeSeriesSchema.method('getData', function (interval, format) {
  var data = [];
  var year = this.metadata.date.getFullYear();
  var month = this.metadata.date.getMonth();
  var day = this.metadata.date.getDate();
  if( interval<1 ) {
    for(var hour in this.millisecond ) {
      if(isNaN(parseInt(hour))  )continue;
      for(var minute in this.millisecond[hour] ) {
        if(!_.isNumber(minute) )continue;
        for(var second in this.millisecond[hour][minute] ) {
          if(!_.isNumber(second) )continue;
          for(var ms in this.millisecond[hour][minute][second] ) {
            if(!_.isNumber(ms) )continue;
            if( this.millisecond[hour][minute][second][millisecond].value ){
              var timestamp = new Date(year,  month, day, hour, minute, second, millisecond);
              data.push( dataFormat( timestamp, this.millisecond[hour][minute][second][millisecond], format) );
            }
          }
        }
      }
    }
  } else if( interval<60 ) {
    for(var hour in this.second ) {
      if(isNaN(parseInt(hour))  )continue;
      for(var minute in this.second[hour] ) {
        if(!_.isNumber(minute) )continue;
        for(var second in this.second[hour][minute] ) {
          if(!_.isNumber(second) )continue;
          if( this.second[hour][minute][second].value ){
            var timestamp = new Date(year,  month, day, hour, minute, second);
            data.push( dataFormat( timestamp, this.second[hour][minute][second].value, format) );
          }
        }
      }
    }
  } else if( interval<3600 ) {
    for(var hour in this.minute ) {
      if(isNaN(parseInt(hour))  )continue;
      for(var minute in this.minute[hour] ) { 
        if(isNaN(parseInt(minute))  )continue;
        if( this.minute[hour][minute].value ){
          var timestamp = new Date(year,  month, day, hour, minute, 0,0);
          data.push( dataFormat( timestamp, this.minute[hour][minute].value, format, {
            //year: year,  month: month, day: day,
            hour: hour, minute: minute, //metadata: this.minute[hour][minute].metadata
          }) );
        }
      }
    }
  } else 
    for(var hour in this.hourly ) {
      if(isNaN(parseInt(hour))  )continue;
      if( this.hourly[hour].value ){
        var timestamp = new Date(year,  month, day, hour, 0, 0,0);
        data.push( dataFormat( timestamp, this.hourly[hour].value, format) );
      }
  }
  return data;
});


TimeSeriesSchema.method('recalc', function (timestamp, value) {
  console.log('recalc statistics..');
  var updates = {}
  var sum=0, i=0;
  if( this.metadata.interval < 1 && this.millisecond) {
    sum = 0;i=0
    for(var hour in this.millisecond){
      if(isNaN(parseInt(hour))  )continue;
      for(var min in this.millisecond[hour]){
        if(isNaN(parseInt(min))  )continue;
        for(var sec in this.millisecond[hour][min]){
          if(isNaN(parseInt(sec))  )continue;
          for(var ms in this.millisecond[hour][min][sec]){
            if(isNaN(parseInt(ms))  )continue;
            if(isNaN(parseInt(this.millisecond[hour][min][sec][ms].value))  )continue;
            if(_.isNaN(parseInt(this.millisecond[hour][min][sec][ms].value)) )continue;
            sum += this.millisecond[hour][min][sec][ms].value;
            i++;
          }
        }
      }
    }
    if( i<=0) i=1;
    if(sum==0)sum=value;
    updates['second.'+timestamp.getHours() +'.'+timestamp.getMinutes()+'.value'] = sum/i;
  } if( this.metadata.interval < 60 && this.second) {
    sum = 0;
    i=0;
    for(var hour in this.second){
      if(isNaN(parseInt(hour))  )continue;
      for(var min in this.second[hour]){
        if(isNaN(parseInt(min))  )continue;
        for(var sec in this.second[hour][min]){
          if(isNaN(parseInt(sec))  )continue;
          if(_.isNaN(parseInt(this.second[hour][min][sec].value)) )continue;
          sum += this.second[hour][min][sec].value;
            min = this.second[hour][min].value
          i++;
        }
      }
    }
    if( i<=0) i=1;
    if(sum==0)sum=value;
    updates['minute.'+timestamp.getHours() +'.'+ timestamp.getMinutes()+'.value'] = sum/i;
  } if( this.metadata.interval < 3600 && this.minute) {
    sum = 0;
    i=0;
    for(var hour in this.minute){
      if(_.isNaN(parseInt(hour))  )break;
      for(var min in this.minute[hour]){
        if(_.isNaN(parseInt(min))  )break;
        if(_.isNaN(parseInt(this.minute[hour][min].value)) )continue;
        sum += parseInt(this.minute[hour][min].value);
        i++;
      }
    }
    if( i<=0) i=1;
    if(sum==0)sum=value;
    updates['hourly.'+ timestamp.getHours() +'.value'] = sum/i;
  }
  
  if( this.statistics.max ) {
    if( value > this.statistics.max)
      updates['statistics.max'] = value;
    if( value < this.statistics.min)
      this.set(['statistics.min'], value);
  } else {
    updates['statistics.max'] = value;
    updates['statistics.min'] = value;
  }
  
  
  if( i>0){
    if( i != this.statistics.i ) {
      updates['statistics.i'] = i;
    }
    if( _.isNumber(sum) ){
      
      console.log(sum);
      updates['statistics.avg'] = sum/i;
    }
  }
  console.log('update statistics');
  console.log(updates);
  this.set(updates);
  this.save( function(error, ok){
    if(error) console.log(error);
  });
});

/**
 * Static methods
 */
TimeSeriesSchema.static('findMax', function (options, callback) {
  _.extend(options.condition, {
    'metadata.date': {$gte: options.from},
    'metadata.date': {$lte: options.to},
  });
  this.find( options.condition ).limit(1).select('statistics.max').sort({'statistics.max': -1}).execFind(function(error, doc){
    if(error) callback(error)
    if( doc.length > 0 )
        callback(null, doc[0].statistics.max);
    else callback(null, NaN);
  });
});
TimeSeriesSchema.static('findMin', function (options, callback) {
  _.extend(options.condition, {
    'metadata.date': {$gte: options.from},
    'metadata.date': {$lte: options.to},
  });
  this.find( options.condition ).limit(1).select('statistics.min').sort({'statistics.min': 1}).execFind(function(error, doc){
    if(error) callback(error)
    else {
      if( doc.length > 0 ){
        callback(null, doc[0].statistics.min);
      } else callback(null, NaN);
    }
  });
});
TimeSeriesSchema.static('findData', function (options, callback) {
  var condition = {'$and': []}
  _.extend(options, {
    condition: {},
    dir: 1,
    to: new Date(),
    //from: new Date(new Date().getTime()-1000*60*60),
  });
  if( Object.keys(options.condition).length>0)
    condition['$and'].push(options.condition);
  condition['$and'].push({'metadata.date': {'$gte': options.from, }});
  condition['$and'].push({'metadata.date': {'$lte': options.to, }});
  var select = "metadata latest ";
  if( !_.isNumber(options.interval) ) {
    options.interval = 60;
  }
  if( options.interval < 1 ) {
    select += "millisecond"
  } else if( options.interval < 60 ) {
    select += "second"
  } else if( options.interval < 3600 ) {
    select += "minute"
  } else {
    select = "hourly";
  }
  console.log(options);
  this.find(condition).sort({'metadata.date': options.dir}).select(select).execFind( function(error, docs){
    if( error ) { callback(error);}
    else {
      console.log('Doc count: '+docs.length);
      var data = [];
      _.each(docs, function(doc){
        _.extend(data, doc.getData(options.interval, options.format) );
      });
      callback(null, data);
    }
  });
});




function getUpdates(timestamp, value, metadata){
  
  var updates = {}
  if( TimeSeriesSchema.options.interval < 1 ) {
    updates['millisecond.'+timestamp.getHours()+'.'+timestamp.getMinutes()+'.'+timestamp.getSeconds()+'.'+timestamp.getMilliSeconds()+'.value']=value;
    if( metadata ) updates['millisecond.'+timestamp.getHours() +'.'+ timestamp.getMinutes() +'.'+ timestamp.getSeconds() +'.'+ timestamp.getMilliSeconds()+'.metadata']=metadata;
  } else if( TimeSeriesSchema.options.interval < 60 ) {
    updates['second.'+timestamp.getHours() +'.'+ timestamp.getMinutes() +'.'+ timestamp.getSeconds()+'.value']=value;
    if( metadata ) updates['second.'+ timestamp.getHours() +'.'+ timestamp.getMinutes() +'.'+ timestamp.getSeconds() +'.metadata']=metadata;
  } else if( TimeSeriesSchema.options.interval < 3600 ){
    updates['minute.'+timestamp.getHours() +'.'+ timestamp.getMinutes()+'.value']=value;
    if( metadata ) updates['minute.'+ timestamp.getHours() +'.'+ timestamp.getMinutes() +'.metadata']=metadata;
  } else if( TimeSeriesSchema.options.interval > 0 ) { 
    updates['hourly.'+timestamp.getHours()+'.value']=value;
    if( metadata ) updates['hourly.'+timestamp.getHours()+'.metadata']=metadata;
  }
  updates['updatedAt.date'] = new Date();
  updates['latest.value'] = value;
  updates['$inc'] = {'statistics.i': 1}
  if( metadata )updates['latest.metadata'] = metadata;
  return updates;
}
TimeSeriesSchema.static('push', function (timestamp, value, metadata, extraCondition, cb)
{
  var day = roundDay(timestamp);
  var condition = {'metadata.date': day};
  _.extend(condition, extraCondition);
  var updates = getUpdates(timestamp, value, metadata);
  var self = this;
  //console.log(updates);
  this.update( condition, updates, function(error, ok){  
    if( error) {
      console.log('update failed: '+error);
      cb(error);
    } else if( ok ) {
      cb(null, ok);
      self.findOne(condition, function(error, doc){
        doc.recalc(timestamp, value);
      });
    } else {
      //console.log('Create new');
      var doc = new self(  { 'metadata.date': day} );
      var updates = getUpdates(timestamp, value, metadata);
      doc.set(updates);
      doc.updatedAt.date = new Date();
      doc.save(cb);
    }
  });
});

/*
TimeSeriesSchema.virtual('value').set(function (timestamp, value) {
  this.latest.value = value;
  this.updatedAt.timestamp = timestamp;
});*/ 


/*TimeSeriesSchema.summary()
{
}*/

module.exports.init = init;
module.exports.schema = TimeSeriesSchema;
module.exports.options = options;
