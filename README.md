mongoose-timeseries
===================

mongoose model for general time series data



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

