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


Usage
------------

```

var mti = require('mongoose-timeseries');

mongoose.connect('mongodb://localhost/mydb');

mti.init('mycol', {minute: true, second: true, millisecond: false});

mti.push(new Date(), 12.12, false /*metadata*/, {} /*extra conditions for doc find*/, function(err, ok){});

```

