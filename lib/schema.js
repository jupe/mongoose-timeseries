/**
 * Module dependencies.
 */
var _ = require("underscore");
var uuid = require('uuid')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Mixed = mongoose.Schema.Types.Mixed;
    
var TimeSeriesSchema = function(args) {
  /*
    allowed interval values (seconds): 
    0.001, 0.002, 0.005, 0.01, 0,02, 0,05, 0.1, 0.2, 0.5,       //milliseconds
    1, 2, 5, 10, 30,  60,                                       //seconds
    120 (2min), 300 (5min), 600 (10min), 1800(30min), 3600(1h)  //minutes
  */
  
  var options = {
      actor: 0,
      interval: 60,  // seconds
      millisecond: false,
      verbose: false,
      postProcessImmediately: false,
      paths: {value: {type: 'number'}, metadata: {type: Mixed}}
    };
    
    
  /*
  var toDay = function(t){
    var d = t.getFullYear()*100*100;
    d += t.getMonth()*100;
    d += t.getDay();
    console.log(d);
    return d;
  }
  var fromDay = function(d){
    var y = Math.round(d/100/100);
    var m = Math.round((d/100)%100);
    var d = Math.round(d%100);
    console.log('y: '+y+'  m: '+m+'  d: '+d);
    return new Date(y,m,d);
  } */
  var roundDay = function(d){
    var t = new Date(d.getFullYear(),
                     d.getMonth(),
                     d.getDate());
    return t;
  }
  /*
  var Hourly = {
    '0':  options.paths,
    '1':  options.paths,
    '2':  options.paths,
    '3':  options.paths,
    '4':  options.paths,
    '5':  options.paths,
    '6':  options.paths,
    '7':  options.paths,
    '8':  options.paths,
    '8':  options.paths,
    '9':  options.paths,
    '10': options.paths,
    '11': options.paths,
    '12': options.paths,
    '13': options.paths,
    '14': options.paths,
    '15': options.paths,
    '16': options.paths,
    '17': options.paths,
    '18': options.paths,
    '19': options.paths,
    '20': options.paths,
    '21': options.paths,
    '22': options.paths,
    '23': options.paths,
  };
  var Minutes = {
      '0': options.paths,
      '1': options.paths ,
      '2': options.paths ,
      '3': options.paths ,
      '4': options.paths ,
      '5': options.paths ,
      '6': options.paths ,
      '7': options.paths ,
      '8': options.paths ,
      '9': options.paths ,
      '10':options.paths ,
      '11':options.paths ,
      '12':options.paths ,
      '13':options.paths ,
      '14':options.paths ,
      '15':options.paths ,
      '16':options.paths ,
      '17':options.paths ,
      '18':options.paths ,
      '19':options.paths ,
      '20':options.paths ,
      '21':options.paths ,
      '22':options.paths ,
      '23':options.paths ,
      '24':options.paths ,
      '25':options.paths ,
      '26':options.paths ,
      '27':options.paths ,
      '28':options.paths ,
      '29':options.paths ,
      '30':options.paths ,
      '31':options.paths ,
      '32':options.paths ,
      '33':options.paths ,
      '34':options.paths ,
      '35':options.paths ,
      '36':options.paths ,
      '37':options.paths ,
      '38':options.paths ,
      '39':options.paths ,
      '40':options.paths ,
      '41':options.paths ,
      '42':options.paths ,
      '43':options.paths ,
      '44':options.paths ,
      '45':options.paths ,
      '46':options.paths ,
      '47':options.paths ,
      '48':options.paths ,
      '49':options.paths ,
      '50':options.paths ,
      '51':options.paths ,
      '52':options.paths ,
      '53':options.paths ,
      '54':options.paths ,
      '55':options.paths ,
      '56':options.paths ,
      '57':options.paths ,
      '58':options.paths ,
      '59':options.paths ,
    }; */
  /**
   * Schema definition
   */
  var schema = new Schema({
    //day: {type: Number, index: true, set: toDay, get: fromDay},
    day: {type: Date, index: true},
    actor: {type: Number, required: true, index: true},
    metadata: {
      interval: {type: Number},
    },
    latest: {
      timestamp: {type: Date},
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
      avg: {type: Number},
      max: {
        value: {type: Number},
        timestamp: {type: Date}
      },
      min: {
        value: {type: Number},
        timestamp: {type: Date}
      }
    }
  });
  
  //schema.index({ day: 1, type: -1 });


   /** 
    * Generate time series paths 
    */
  function init(_options)
  {
    _.extend(options, _options);
    
    mixed = false;
    if( mixed ) {
      schema.add({hourly: Mixed});
      if( options.interval < 3600 ) {
        schema.add({minutes: Mixed}); 
      }
      if( options.interval < 60 ) {
        schema.add({seconds: Mixed});
      }
      if( options.interval < 1 ) {
        schema.add({milliseconds: Mixed});
      }
    }
    else {
      /*var tmp, h, m;
      for(h in Hourly){ 
        tmp = {}
        tmp[h] = Hourly[h];
        schema.add( {hourly: tmp} );
        for(m in Minutes){
          tmp[h][m] = Minutes[m];
        }       
        schema.add( {minutes: tmp} );        
      }*/
      
      
      var hourly = {};
      var minutes = {};
      var seconds = {};
      var milliseconds = {};
      
      var minute = {};
      var second = {};
      var millisecond = {};
      var i;
      
      
      if( options.interval < 3600 ) {
        //console.log('minutes..');
        for(i=0;i<60;i+=1){ 
          minutes[i] = _.clone(options.paths);
        }
      }
      
      if( options.interval < 60 ) {
        //console.log('seconds..');
        for(i=0;i<60;i+=1){ 
          seconds[i] = _.clone(minutes);
        }
      }
      if( options.interval < 1 ) {
        //console.log('milliseconds..');
        for(var i=0;i<1000;i+=1){ 
          milliseconds[i] = seconds;
        }
      }
      
      for(i=0;i<24;i++){ 
        hourly[i] = options.paths;
        if( options.interval < 3600 )
          minute[i] = minutes;
        if( options.interval < 60 )
          second[i] = seconds;
        if( options.interval < 1 )
          millisecond[i] = milliseconds;
      }
      
      schema.add({'hourly': hourly});
      if( options.interval < 3600 ){
        schema.add({minutes: minute});
      } if( options.interval < 60 ){
        schema.add({seconds: second});
      } if( options.interval < 1 ){
        schema.add({milliseconds: millisecond});
      }
    }
    
    
    var paths = []
    schema.eachPath( function(path, spath,content){
      paths.push(path);
    });
    require('fs').writeFile('paths.json', JSON.stringify(paths, null, 4), function(err){});
    
    
  }
  /**
   * Post hook.
   */
  schema.pre('save', function (next) {
    //console.log('saving..');
    //console.log(this);
    if( this.isNew ) {
      this.metadata.interval = options.interval;
      this.statistics.i = 1; 
      this.statistics.min.value = this.latest.value; 
      this.statistics.min.timestamp = this.latest.timestamp; 
      this.statistics.max.value = this.latest.value;
      this.statistics.max.timestamp = this.latest.timestamp;
      this.statistics.avg = this.latest.value;
    }
    next();
  });

  /**
   * Methods
   */
  schema.static('getData', function (interval) {
    
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
  schema.method('getData', function (interval, format) {
    var data = [];
    var year = this.day.getFullYear();
    var month = this.day.getMonth();
    var day = this.day.getDate();
    if( interval<1 ) {
      for(var hour in this.milliseconds ) {
        if(isNaN(parseInt(hour))  )continue;
        for(var minute in this.milliseconds[hour] ) {
          if(!_.isNumber(minute) )continue;
          for(var second in this.milliseconds[hour][minute] ) {
            if(!_.isNumber(second) )continue;
            for(var ms in this.milliseconds[hour][minute][second] ) {
              if(!_.isNumber(ms) )continue;
              if( this.milliseconds[hour][minute][second][millisecond].value ){
                var timestamp = new Date(year,  month, day, hour, minute, second, millisecond);
                data.push( dataFormat( timestamp, this.milliseconds[hour][minute][second][millisecond], format) );
              }
            }
          }
        }
      }
    } else if( interval<60 ) {
      for(var hour in this.seconds ) {
        if(isNaN(parseInt(hour))  )continue;
        for(var minute in this.seconds[hour] ) {
          if(!_.isNumber(minute) )continue;
          for(var second in this.seconds[hour][minute] ) {
            if(!_.isNumber(second) )continue;
            if( this.seconds[hour][minute][second].value ){
              var timestamp = new Date(year,  month, day, hour, minute, second);
              data.push( dataFormat( timestamp, this.seconds[hour][minute][second].value, format) );
            }
          }
        }
      }
    } else if( interval<3600 ) {
      for(var hour in this.minutes ) {
        if(isNaN(parseInt(hour))  )continue;
        for(var minute in this.minutes[hour] ) { 
          if(isNaN(parseInt(minute))  )continue;
          if( this.minutes[hour][minute].value ){
            var timestamp = new Date(year,  month, day, hour, minute, 0,0);
            data.push( dataFormat( timestamp, this.minutes[hour][minute].value, format, {
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


  schema.method('recalc', function (timestamp, value) {
    var updates = {}
    var sum=0, i=0,
        hour, min, sec, ms;
    if( this.metadata.interval < 1 && this.millisecond) {
      if(options.verbose)console.log('ms recalc');
      sum = 0;i=0
      for(hour in this.millisecond){
        if(isNaN(parseInt(hour))  )continue;
        for(min in this.millisecond[hour]){
          if(isNaN(parseInt(min))  )continue;
          for(sec in this.millisecond[hour][min]){
            if(isNaN(parseInt(sec))  )continue;
            for(ms in this.millisecond[hour][min][sec]){
              if(isNaN(parseInt(ms))  )continue;
              if(isNaN(parseInt(this.millisecond[hour][min][sec][ms].value))  )continue;
              if(isNaN(parseInt(this.millisecond[hour][min][sec][ms].value)) )continue;
              sum += this.millisecond[hour][min][sec][ms].value;
              i++;
            }
          }
        }
      }
      if( i<=0) i=1;
      if(value&&sum==0)sum=value;
      updates['seconds.'+timestamp.getHours() +'.'+timestamp.getMinutes()+'.value'] = sum/i;
    } else if( this.metadata.interval < 60 && this.second) {
      if(options.verbose)console.log('s recalc');
      sum = 0;
      i=0;
      
      for(hour in this.seconds){
        if(isNaN(parseInt(hour))  )continue;
        for(min in this.seconds[hour]){
          if(isNaN(parseInt(min))  )continue;
          for(sec in this.seconds[hour][min]){
            if(isNaN(parseInt(sec))  )continue;
            if(isNaN(parseInt(this.seconds[hour][min][sec].value)) )continue;
            sum += this.seconds[hour][min][sec].value;
            i++;
          }
        }
      }
      if( i<=0) i=1;
      if(value&&sum==0)sum=value;
      updates['minutes.'+timestamp.getHours() +'.'+ timestamp.getMinutes()+'.value'] = sum/i;
    } else if( this.metadata.interval < 3600 && this.minutes) {
      if(options.verbose)console.log('min recalc');
      sum = 0;
      i=0;
      for(var hour in this.minutes){
        if(isNaN(parseInt(hour))  )break;
        for(var min in this.minutes[hour]){
          if(isNaN(parseInt(min))  )break;
          if(isNaN(parseInt(this.minutes[hour][min].value)) )continue;
          sum += parseInt(this.minutes[hour][min].value);
          i++;
        }
      }
      if( i<=0) i=1;
      if(value&&sum==0)sum=value;
      updates['hourly.'+ timestamp.getHours() +'.value'] = sum/i;
    } else if( this.metadata.interval >= 3600 && this.hourly) {
      sum = 0;
      i=0;
      for(hour in this.hourly){
        if(isNaN(parseInt(hour))  )break;
        if(isNaN(parseInt(this.hourly[hour].value)) )continue;
        sum += parseInt(this.hourly[hour].value);
        i++;
      }
      if( i<=0) i=1;
    }
    
    if( i>0){
      if( i != this.statistics.i ) {
        updates['statistics.i'] = i;
      }
      if( _.isNumber(sum) ){
        updates['statistics.avg'] = sum/i;
      }
    }
    
    this.set(updates);
    this.save( function(error, ok){
      if(error) console.log(error);
    });
  });
  
  schema.method('minmax', function (timestamp, value) {
  
    var updates = {}, needToSave=false;
    if( _.isNumber(this.statistics.max.value) ) {
      if( value > this.statistics.max.value){
        updates['statistics.max.timestamp'] = timestamp;
        updates['statistics.max.value'] = value;
        needToSave=true;
      }
    }else {
      updates['statistics.max.timestamp'] = timestamp;
      updates['statistics.max.value'] = value;
      needToSave=true;
    }
    if( _.isNumber(this.statistics.min.value) ) {
      if( value < this.statistics.min.value){
        updates['statistics.min.timestamp'] = timestamp;
        updates['statistics.min.value'] = value;
        needToSave=true;
      }
    } else {
      updates['statistics.min.timestamp'] = timestamp;
      updates['statistics.min.value'] = value;
      needToSave=true;
    }
    if( needToSave ) {    
      this.set(updates);
      this.save( function(error, ok){
        if(error) console.log(error);
      });
    }
  });

  /**
   * Static methods
   */
  schema.static('findMax', function (conditions, callback) {
   var condition = { '$and': [
      {'day': {$gte: conditions.from}},
      {'day': {$lte: conditions.to}}]
    };
    //console.log('findMax: '+JSON.stringify(condition));
    this.find( condition ).limit(1).select('statistics.max').sort({'statistics.max.value': -1}).execFind(function(error, doc){
      if(error) callback(error)
      else if( doc.length == 1 ){
        callback(null, doc[0].statistics.max);
      } else callback(null, NaN);
    });
  });
  schema.static('findMin', function (conditions, callback) {
    var condition = { '$and': [
      {'day': {$gte: conditions.from}},
      {'day': {$lte: conditions.to}}]
    };
    //console.log('findMin: '+JSON.stringify(condition));
    this.find( condition ).limit(1).select('statistics.min').sort({'statistics.min.value': 1}).execFind(function(error, doc){
      if(error) callback(error)
      else if(doc){
        //console.log(doc);
        callback(null, doc[0].statistics.min);
      } else callback(null, NaN);
    });
  });
  schema.static('findData', function (options, callback) {
    var condition = {'$and': []}
    _.extend(options, {
      condition: {},
      dir: 1,
      to: new Date(),
      //from: new Date(new Date().getTime()-1000*60*60),
    });
    if( Object.keys(options.condition).length>0)
      condition['$and'].push(options.condition);
    condition['$and'].push({'day': {'$gte': options.from, }});
    condition['$and'].push({'day': {'$lte': options.to, }});
    var select = "metadata latest ";
    if( !_.isNumber(options.interval) ) {
      options.interval = 60;
    }
    if( options.interval < 1 ) {
      select += "millisecond "
    } else if( options.interval < 60 ) {
      select += "seconds "
    } else if( options.interval < 3600 ) {
      select += "minutes "
    } else {
      select = "hourly ";
    }
    console.log(options);
    this.find(condition).sort({'day': options.dir}).select(select).execFind( function(error, docs){
      if( error ) { callback(error);}
      else {
        //console.log('Doc count: '+docs.length);
        var data = [];
        _.each(docs, function(doc){
          _.extend(data, doc.getData(options.interval, options.format) );
        });
        callback(null, data);
      }
    });
  });




  function getUpdates(timestamp, value, metadata, first){
    
    var updates = {}
    if( options.interval < 1 ) {
      updates['milliseconds.'+timestamp.getHours()+'.'+timestamp.getMinutes()+'.'+timestamp.getSeconds()+'.'+timestamp.getMilliseconds()+'.value']=value;
      if( metadata ) updates['milliseconds.'+timestamp.getHours() +'.'+ timestamp.getMinutes() +'.'+ timestamp.getSeconds() +'.'+ timestamp.getMilliseconds()+'.metadata']=metadata;
    } else if( options.interval < 60 ) {
      updates['seconds.'+timestamp.getHours() +'.'+ timestamp.getMinutes() +'.'+ timestamp.getSeconds()+'.value']=value;
      if( metadata ) updates['seconds.'+ timestamp.getHours() +'.'+ timestamp.getMinutes() +'.'+ timestamp.getSeconds() +'.metadata']=metadata;
    } else if( options.interval < 3600 ){
      updates['minutes.'+timestamp.getHours() +'.'+ timestamp.getMinutes()+'.value']=value;
      if( metadata ) updates['minutes.'+ timestamp.getHours() +'.'+ timestamp.getMinutes() +'.metadata']=metadata;
    } else if( options.interval > 0 ) { 
      updates['hourly.'+timestamp.getHours()+'.value']=value;
      if( metadata ) updates['hourly.'+timestamp.getHours()+'.metadata']=metadata;
    }
    updates['updatedAt.date'] = new Date();
    updates['latest.timestamp'] = timestamp;
    updates['latest.value'] = value;
    updates['$inc'] = {'statistics.i': 1}
    if( metadata )updates['latest.metadata'] = metadata;
    return updates;
  }
  schema.static('recalc', function(timestamp, extraCondition) {
     var day = roundDay(timestamp);
     var condition = {'day': day};
    _.extend(condition, extraCondition);
    this.findOne(condition, function(e,doc){ 
      if(e){
      } else {
        doc.recalc(timestamp);
      }
    });
  });
  schema.static('push', function (timestamp, value, metadata, extraCondition, cb)
  {
    var day = roundDay(timestamp);
    var condition = {'day': day};
    _.extend(condition, extraCondition);
    var updates = getUpdates(timestamp, value, metadata);
    var self = this;
    if(options.verbose)console.log('Cond: '+JSON.stringify(condition));
    if(options.verbose)console.log('Upda: '+JSON.stringify(updates));
    this.findOneAndUpdate( condition, updates, function(error, doc){  
      if( error) {
        console.log('update failed: '+error);
        if(cb)cb(error);
      } else if( doc ) {
        //console.log('just update');
        
        doc.minmax(timestamp, value);
        
        if(cb)cb(null, doc);
        
        if(options.postProcessImmediately){
          doc.recalc(timestamp, value);
        }
        
      } else {
        //console.log('Create new');
        var doc = new self(  { 'day': day, actor: options.actor } );
        var updates = getUpdates(timestamp, value, metadata, true);
        //updates['metadata.interval'] = options.interval;
        //console.log('Upda: '+JSON.stringify(updates));
        doc.set(updates);
        doc.save(cb);
      }
    });
  });

  /*
  TimeSeriesSchema.virtual('value').set(function (timestamp, value) {
    this.latest.value = value;
    this.updatedAt.timestamp = timestamp;
  });*/ 
  init(args);
  return schema;
};
module.exports = TimeSeriesSchema;
