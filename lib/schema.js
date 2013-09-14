/**
 * Module dependencies.
 */
var _ = require("underscore");
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Mixed = mongoose.Schema.Types.Mixed;
  
var fs = require('fs');
    
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
    day: {type: Date, index: true, required: true},
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
    },
    // Data itself
    //hourly: [ Schema.Types.Mixed ],
    //minutes: [ [Schema.Types.Mixed] ],
    //seconds: [ [ [Schema.Types.Mixed ] ] ],
    //milliseconds: [ [ [ [Schema.Types.Mixed ] ] ] ],
  });
  
  //schema.index({ day: 1, type: -1 });


   /** 
    * Generate time series paths 
    */
  function init(_options)
  {
    _.extend(options, _options);
    // Optimize schema performance
    schema.add({ daily: Schema.Types.Mixed});
    schema.add({ hourly: [ Schema.Types.Mixed ]});
    if( options.interval < 3600 ) {
      //schema.add({minutes: [ {m: [ Schema.Types.Mixed ] }] }); 
      schema.add({minutes: [ Schema.Types.Mixed ]}); 
    }
    if( options.interval < 60 ) {
      //schema.add({seconds: [ {m: [ {s: [ Schema.Types.Mixed ] }]} ]});
      schema.add({seconds: [ Schema.Types.Mixed ]}); 
    }
    if( options.interval < 1 ) {
      //schema.add({milliseconds: [ {m: [ {s: [ {ms: [Schema.Types.Mixed ] }] }] }]});
      schema.add({milliseconds: [ Schema.Types.Mixed ]}); 
    }
    /*
    var paths = []
    schema.eachPath( function(path, spath,content){
      paths.push(path);
    });
    fs.writeFile('paths.json', JSON.stringify(paths, null, 4), function(err){});
    */
    
  }
  /**
   * Post hook.
   */
  schema.pre('save', function (next) {
    //console.log(this);
    if( this.isNew ) {
      //console.log('saving new..');
      this.metadata.interval = options.interval;
      this.statistics.i = 1; 
      if( this.latest ){
        this.statistics.min.value = this.latest.value; 
        this.statistics.min.timestamp = this.latest.timestamp; 
        this.statistics.max.value = this.latest.value;
        this.statistics.max.timestamp = this.latest.timestamp;
        this.statistics.avg = this.latest.value;
      }
    } else {
      //console.log('updating old..');
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
        if( this.hourly[hour] && this.hourly[hour].value ){
          var timestamp = new Date(year,  month, day, hour, 0, 0,0);
          data.push( dataFormat( timestamp, this.hourly[hour].value, format) );
        }
    }
    return data;
  });


  schema.method('recalc', function (timestamp, value, cb) {
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
        if(isNaN(parseInt(hour))  )break;
        for(min in this.seconds[hour]){
          if(isNaN(parseInt(min))  )break;
          for(sec in this.seconds[hour][min]){
            if(isNaN(parseInt(sec))  )break;
            if(!this.seconds[hour][min][sec])continue;
            if(isNaN(parseInt(this.seconds[hour][min][sec].value)) )continue;
            sum += this.seconds[hour][min][sec].value;
            i++;
          }
        }
      }
      if( i<=0) i=1;
      if(value&&sum==0)sum=value;
      updates['minutes.'+timestamp.getHours() +'.'+ timestamp.getMinutes()] = {value: sum/i};
    } else if( this.metadata.interval < 3600 && this.minutes) {
      if(options.verbose)console.log('min recalc');
      sum = 0;
      i=0;
      for(var hour in this.minutes){
        if( isNaN(parseInt(hour))  )break;
        for(var min in this.minutes[hour]){
          if(isNaN(parseInt(min)))break;
          if( !this.minutes[hour][min] )continue;
          if(isNaN(parseInt(this.minutes[hour][min].value)) )continue;
          sum += parseInt(this.minutes[hour][min].value);
          i++;
        }
      }
      if( i<=0) i=1;
      if(value&&sum==0)sum=value;
      updates['hourly.'+ timestamp.getHours() ] = { value: sum/i };
    } else if( this.metadata.interval >= 3600 && this.hourly) {
      sum = 0;
      i=0;
      for(hour in this.hourly){
        if(this.hourly[hour]===null ||isNaN(parseInt(hour))  )break;
        if( !this.hourly[hour] )continue;
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
    if(options.verbose)console.log(updates);
    this.set(updates);
    this.save( cb );
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
  schema.static('findData', function (request, callback) {
    
    var condition = {'$and': []}
    _.extend(condition, request.condition);
    if( !request.to ) request.to = new Date();
    if( !request.dir) request.dir = 1;
    if( Object.keys(request.condition).length>0)
      condition['$and'].push(request.condition);
    condition['$and'].push({'day': {'$gte': request.from, }});
    condition['$and'].push({'day': {'$lte': request.to, }});
    var select = "metadata statistics latest daily day ";
    if( !_.isNumber(request.interval) ) {
      request.interval = 3600;
    }
    if( request.interval < 1 ) {
      select += "millisecond "
    } else if( request.interval < 60 ) {
      select += "seconds "
    } else if( request.interval < 3600 ) {
      select += "minutes "
    } else {
      select += "hourly ";
    }
    if(options.verbose)console.log(request);
    if(options.verbose)console.log(JSON.stringify(condition));
    this.find(condition).sort({'day': request.dir}).select(select).execFind( function(error, docs){
      if( error ) { callback(error);}
      else {
        if(options.verbose)console.log('Doc count: '+docs.length);
        var data = [], i;
        docs.forEach( function(doc){
          doc.getData(request.interval, request.format).forEach( function(row){
            data.push( row );
          });
        });
        callback(null, data);
      }
    });
  });


  function getInitializer(){
    var updates = {};
    
    updates.hourly = [];
    updates.hourly[23]={};
    if( options.interval < 3600 ) {
      updates.minutes = [];
      if( options.interval < 60 ) {
        updates.seconds = [];
      }
      for(var i=0;i<24;i++){
        updates.minutes[i]=[];
        updates.minutes[i][59] = null; //initialize length
        if( options.interval < 60 ) {
          updates.seconds[i]=[];
          for(var j=0;j<60;j++){
            updates.seconds[i][j] = []; //initialize length
            updates.seconds[i][j][59] = null; //initialize length
          }
        }
      }
    }
    /*
    updates.seconds = [];
    updates.seconds[23]=[]};
    updates.seconds[23][59] = [];
    updates.seconds[23][59][59] = {};
    
    updates.milliseconds = [];
    updates.milliseconds[23]=[];
    updates.milliseconds[23][59] = [];
    updates.milliseconds[23][59][59] = [];
    updates.milliseconds[23][59][59][999] = {};
    */
    return updates;
  }

  function getUpdates(timestamp, value, metadata, first){
    
    var updates = {}
    if( options.interval < 1 ) {
      updates['milliseconds.'+timestamp.getHours()+'.'+timestamp.getMinutes()+'.'+timestamp.getSeconds()+'.'+timestamp.getMilliseconds()+'.value']=value;
      if( metadata ) updates['milliseconds.'+timestamp.getHours() +'.'+ timestamp.getMinutes() +'.'+ timestamp.getSeconds() +'.'+ timestamp.getMilliseconds()+'.metadata']=metadata;
    } else if( options.interval < 60 ) {
      var set = {value: value};
      if( metadata ) set.metadata=metadata;
      updates['seconds.'+timestamp.getHours() +'.'+ timestamp.getMinutes() +'.'+ timestamp.getSeconds()]=set
    } else if( options.interval < 3600 ){
      var set = { value: value };
      if( metadata ) set.metadata=metadata;
      updates['minutes.'+timestamp.getHours() +'.'+ timestamp.getMinutes()]=set;
    } else if( options.interval > 0 ) { 
      var set = { value: value }
      if( metadata ) set.metadata = metadata;
      updates['hourly.'+timestamp.getHours()]=set;
      updates['daily'] = set
    }
    //statistics
    updates['updatedAt.date'] = new Date();
    updates['latest.timestamp'] = timestamp;
    updates['latest.value'] = value;
    updates['$inc'] = {'statistics.i': 1}
    if( metadata )updates['latest.metadata'] = metadata;
    return updates;
  }
  schema.static('recalc', function(timestamp, extraCondition, cb) {
     var day = roundDay(timestamp);
     var condition = {'day': day};
    _.extend(condition, extraCondition);
    this.findOne(condition, function(e,doc){ 
      if(e){
        cb(e);
      } else {
        doc.recalc(timestamp, doc.latest.value, cb);
      }
    });
  });
  schema.method( 'push', function(timestamp, value, cb) {
    var ts = new Date(timestamp);
    var h = ts.getHours(),
        m = ts.getMinutes(),
        s = ts.getSeconds();
    this.set('daily', value);
    this.set('hourly.'+h+'', value);
    this.set('minute.'+h+'.'+m, value);
    this.set('minute.'+h+'.'+m+'.'+s, value);
    this.save(cb);
  });
  schema.static('push', function (timestamp, value, metadata, extraCondition, cb){
    var day = roundDay(timestamp);
    var condition = {'day': day};
    _.extend(condition, extraCondition);
    var updates = getUpdates(timestamp, value, metadata);
    var self = this;
    if(options.verbose)console.log('\nCond: '+JSON.stringify(condition));
    if(options.verbose)console.log('Upda: '+JSON.stringify(updates));
    this.findOneAndUpdate( condition, updates, function(error, doc){  
      if( error) {
        if(cb)cb(error);
      } else if( doc ) {
        //console.log('Updated -> calc stats');
        doc.minmax(timestamp, value);
        if(cb)cb(null, doc);
        
        if(options.postProcessImmediately){
          doc.recalc(timestamp, value);
        }
        
      } else {
        //console.log('Create new');
        var datainit = getInitializer();
        var doc = new self( { day: day, actor: options.actor } );
        doc.set( datainit );
        doc.set( updates );
        doc.save( cb );
        
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
