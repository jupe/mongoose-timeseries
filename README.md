mongoose-timeseries
===================

Mongoose model for general time series data.

Purpose:
--------
Main purpose for this project was to store time series data efficiently because of RRDtool -type database lose information over time 
and it's not very flexible when sensor structure changes.

Why and how:
------------
Mongodb is great database also for time series data + it is flexible in the large number of data. This library is optimized store 
time series data (e.g. temperature) to mongodb with mongoose. It calculate automatically lower resolution averages (in background) 
so it allows very quick queries of the long periods. storage only one doc / sensor / day . This allows high precision data (original) 
for whole measure period ( not as the "rrdtool"-type databases, which lose information over time..).

Installation
------------

npm install mongoose-ts (not yet)


API
---
init( <collection>, options)
   options: {
    interval: Number,
    path: <Mongoose paths for each steps>
   }


  Allowed interval values (seconds): 
  0.001, 0.002, 0.005, 0.01, 0,02, 0,05, 0.1, 0.2, 0.5,       //milliseconds
  1, 2, 5, 10, 30,  60,                                       //seconds
  120 (2min), 300 (5min), 600 (10min), 1800(30min), 3600(1h)  //minutes
  
  Default path:
  { 
    value: {type: Number}, 
    metadata: {type: Mixed}
  }


push( <Date>, <value>, <metadata>, <extraCondition>, <callback> )

findData(options, callbac)
findMax(options, callback)
findMin(options, callback)
model   -> normal mongoose model instance

Usage
------------

```

var mti = require('mongoose-timeseries');

mongoose.connect('mongodb://localhost/mydb');

//Init timeseries schema and register it to mongoose
mti.init('mycol', {interval: 1});

// Push new data to collection
mti.push(new Date(), 12.12, false /*metadata*/, {} /*extra conditions for doc find*/, function(err, ok){});
..

/** Find data of given period: */
//var format = 'hash'
var format = '[x,y]'
//var format = '[ms,y]'
mti.findData( {
    from: new Date(new Date()-1000*60*60*24), 
    to: new Date(), 
    condition: {},         //for more mongoose find conditions than just "from" & "to"
    interval: 60,          //which period will be fetched
    format: format},       // [x,y]  --> [ [ Date, y], [Date, y2], ... ]
                           // [ms,y]  --> [ [ 123490909344354 /*Date.getTime()*/, y], , ... ] -> used for example charts..
    function(error, data){
  if(error)console.log(error);
  else console.log('len: '+data.length);
});

//mti.findMin( options, callback)
//mti.findMax( options, callback)

```

